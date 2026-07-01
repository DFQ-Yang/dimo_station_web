"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const room_manager_1 = __importDefault(require("./room-manager"));
const PORT = process.env.PORT || 3001;
const server = new ws_1.WebSocketServer({ port: parseInt(PORT.toString()) });
const roomManager = new room_manager_1.default();
server.on('connection', (ws) => {
    console.log('新的 WebSocket 连接建立');
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(ws, message);
        }
        catch (error) {
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
function handleMessage(ws, message) {
    switch (message.type) {
        case 'join':
            handleJoin(ws, message.roomCode);
            break;
        case 'leave':
            handleLeave(ws, message.roomCode);
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
function handleJoin(ws, roomCode) {
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
            if (peer.readyState === ws_1.WebSocket.OPEN) {
                peer.send(JSON.stringify({ type: 'peer-joined' }));
            }
        }
    }
    console.log(`Peer ${result.peerId} 加入房间 ${roomCode}`);
}
function handleLeave(ws, roomCode) {
    const leftRoomCode = roomManager.leaveRoom(ws);
    if (leftRoomCode) {
        // 通知房间内其他 peers
        const room = roomManager.getRoom(leftRoomCode);
        if (room) {
            for (const peer of room.peers) {
                if (peer.readyState === ws_1.WebSocket.OPEN) {
                    peer.send(JSON.stringify({ type: 'peer-left' }));
                }
            }
        }
    }
}
function handleDisconnect(ws) {
    const roomCode = roomManager.leaveRoom(ws);
    if (roomCode) {
        // 通知房间内其他 peers
        const room = roomManager.getRoom(roomCode);
        if (room) {
            for (const peer of room.peers) {
                if (peer.readyState === ws_1.WebSocket.OPEN) {
                    peer.send(JSON.stringify({ type: 'peer-left' }));
                }
            }
        }
    }
}
function forwardMessage(sender, message) {
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
        if (peer !== sender && peer.readyState === ws_1.WebSocket.OPEN) {
            peer.send(JSON.stringify(message));
        }
    }
}
console.log(`信令服务器启动成功，监听端口 ${PORT}`);
console.log(`WebSocket 地址: ws://localhost:${PORT}`);
