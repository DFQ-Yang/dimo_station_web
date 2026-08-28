import 'dotenv/config';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import RoomManager from './room-manager';
import { SignalMessage } from './types';
import pool from './db/mysql';
import { testConnection } from './db/mysql';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import type { RowDataPacket } from 'mysql2';


const roomManager = new RoomManager();
const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });
const router = express.Router();

// 测试数据库连接
testConnection();

// 设置跨域
app.use(cors());
app.use(express.json());
app.use('/api', router);
httpServer.listen(process.env.PORT || 3301, () => {console.log(`HTTP服务器启动成功，监听端口 ${process.env.PORT || 3301}`)});

// 短链接生成接口
router.post('/short-link', async (req, res) => {
  try {
    const raw = req.body?.longLink;
    if(!raw || typeof raw !== 'string'){
      res.status(400).json({ message: 'longLink is required' });
      return;
    }

    // 原始输入先做协议白名单校验，拦截 javascript:/data:/file: 等危险 scheme
    // 注意：new URL('https://javascript:') 会把 javascript 解析成 hostname，
    // 导致 protocol 白名单失效，因此必须在解析前用正则拦截。
    const rawTrim = raw.trim();
    if (/^(?!https?:)[a-z][a-z0-9+.-]*:/i.test(rawTrim)) {
      res.status(400).json({ message: 'longLink is not a valid http or https url' });
      return;
    }

    // 补全协议头
    let normalized = rawTrim;
    if(!/^https?:\/\//i.test(normalized)){
      normalized = 'https://' + normalized.replace(/^\/+/, '');
    }

    // 验证url是否合法
    let target: URL;
    try {
      target = new URL(normalized);
    } catch (err) {
      res.status(400).json({ message: 'longLink is invalid' });
      return;
    }
    if(target.protocol !== 'https:' && target.protocol !== 'http:'){
      res.status(400).json({ message: 'longLink is not a valid http or https url' });
      return;
    }
    if(/[:\s\\]/.test(target.hostname) || !target.hostname){
      res.status(400).json({ message: 'longLink is not a valid url' });
      return;
    }
    // 兜底：WHATWG 解析器会把 https://javascript/ 的 javascript 当作 hostname，
    // 这里显式拒绝这类伪协议混淆写法，避免生成无意义/可疑短链。
    if(/^(javascript|data)$/i.test(target.hostname)){
      res.status(400).json({ message: 'longLink is not a valid url' });
      return;
    }
    const longLink = target.toString();
    
    // 生成并拼接短链接
    const code = await generateShortLink(longLink);
    await pool.execute('INSERT INTO short_link_table (short_link, long_link, created_at) VALUES (?, ?, ?)', [code, longLink, new Date()]);
    const base_url = process.env.SHORT_LINK_BASE_URL || `http://localhost:${process.env.PORT || 3301}`;
    res.json({ shortLink: `${base_url}/s/${code}`, code });
  } catch (err) {
    console.error('短链接生成失败:', err);
    res.status(500).json({ message: '短链接生成失败', error: (err as Error).message });
  }

});

// 解析短链接并重定向
app.get('/s/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if(!code){
      res.status(400).json({ message: 'code is required' });
      return;
    }
    
    const [rows] = await pool.execute('SELECT * FROM short_link_table WHERE short_link = ?', [code]) as RowDataPacket[];
    console.log(rows);
    if(rows.length === 0){
      res.status(404).json({ message: '短链接不存在' });
      return;
    } 
    res.redirect(rows[0].long_link);
  } catch (err) {
    console.error('短链接查询失败:', err);
    res.status(500).json({ message: '短链接查询失败', error: (err as Error).message });
  }
});

wss.on('connection', (ws: WebSocket) => {
  console.log('新的 WebSocket 连接建立');

  ws.on('message', (data: string) => {
    try {
      const message: SignalMessage = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error('消息解析错误:', error);
      ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket 连接关闭');
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
});

function handleMessage(ws: WebSocket, message: SignalMessage): void {
  switch (message.type) {
    case 'join':
      handleJoin(ws, message.roomCode!);
      break;
    case 'leave':
      handleLeave(ws, message.roomCode!);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      // 转发 WebRTC 信令消息给房间内其他 peers
      forwardMessage(ws, message);
      break;
    default:
      console.warn('未知消息类型:', message.type);
  }
}

function handleJoin(ws: WebSocket, roomCode: string): void {
  const result = roomManager.joinRoom(roomCode, ws);

  if (!result.success) {
    ws.send(JSON.stringify({ type: 'room-full' }));
    return;
  }

  // 通知新加入的 peer 它的 peerId
  ws.send(JSON.stringify({ 
    type: 'joined', 
    peerId: result.peerId,
    roomCode 
  }));

  // 如果房间内已有其他 peer，通知双端
  if (result.peers.length > 0) {
    // 通知新 peer 有其他人已在线
    ws.send(JSON.stringify({ type: 'peer-joined' }));
    
    // 通知已在线的 peer 有新 peer 加入
    for (const peer of result.peers) {
      if (peer.readyState === WebSocket.OPEN) {
        peer.send(JSON.stringify({ type: 'peer-joined' }));
      }
    }
  }

  console.log(`Peer ${result.peerId} 加入房间 ${roomCode}`);
}

function handleLeave(ws: WebSocket, roomCode: string): void {
  const leftRoomCode = roomManager.leaveRoom(ws);
  
  if (leftRoomCode) {
    // 通知房间内其他 peers
    const room = roomManager.getRoom(leftRoomCode);
    if (room) {
      for (const peer of room.peers) {
        if (peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify({ type: 'peer-left' }));
        }
      }
    }
  }
}

function handleDisconnect(ws: WebSocket): void {
  const roomCode = roomManager.leaveRoom(ws);
  
  if (roomCode) {
    // 通知房间内其他 peers
    const room = roomManager.getRoom(roomCode);
    if (room) {
      for (const peer of room.peers) {
        if (peer.readyState === WebSocket.OPEN) {
          peer.send(JSON.stringify({ type: 'peer-left' }));
        }
      }
    }
  }
}

function forwardMessage(sender: WebSocket, message: SignalMessage): void {
  const roomCode = roomManager['peerRoomMap'].get(sender);
  if (!roomCode) {
    console.warn('发送者不在任何房间中');
    return;
  }

  const room = roomManager.getRoom(roomCode);
  if (!room) {
    console.warn('房间不存在:', roomCode);
    return;
  }

  // 转发给房间内除发送者外的所有 peers
  for (const peer of room.peers) {
    if (peer !== sender && peer.readyState === WebSocket.OPEN) {
      peer.send(JSON.stringify(message));
    }
  }
}

console.log(`信令服务器启动成功，监听端口 ${process.env.PORT || 3301}`);
console.log(`WebSocket 地址: ws://localhost:${process.env.PORT || 3301}`);

// 短链接生成函数
function generateShortLink(longLink: any) {
  const shortLink = crypto.randomBytes(4).toString('hex');
  return shortLink;
}
