import SignalService from './signal.service';
import { SignalMessage, FileTransferRequest, TransferProgress } from '../types/webrtc.types';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private fileTransfers: Map<string, { file: File, chunks: Blob[] }> = new Map();
  private receiveBuffers: Map<string, { chunks: ArrayBuffer[], totalChunks: number, receivedChunks: number, fileName: string, fileType: string }> = new Map();
  private readonly CHUNK_SIZE = 16 * 1024; // 16KB per chunk
  private pendingFileRequests: Map<string, FileTransferRequest> = new Map();
  
  // 事件回调
  public onFileReceived: ((file: { fileId: string, fileName: string, fileType: string, data: Blob }) => void) | null = null;
  public onFileRequest: ((fileRequest: FileTransferRequest) => void) | null = null;
  public onProgress: ((progress: TransferProgress) => void) | null = null;
  public onPeerConnected: (() => void) | null = null;
  public onPeerDisconnected: (() => void) | null = null;

  constructor() {
    // 监听信令消息
    SignalService.onMessage((message) => this.handleSignalMessage(message));
  }

  async joinRoom(roomCode: string): Promise<void> {
    // 连接到信令服务器（如果未连接）
    if (!SignalService.isConnected()) {
      await SignalService.connect('ws://localhost:3001');
    }

    // 发送加入房间消息
    SignalService.send({
      type: 'join',
      roomCode,
    });
  }

  private async handleSignalMessage(message: SignalMessage): Promise<void> {
    switch (message.type) {
      case 'joined':
        console.log('成功加入房间:', message.roomCode);
        break;
      
      case 'peer-joined':
        console.log('对方加入房间，开始建立连接');
        await this.createOffer();
        break;
      
      case 'peer-left':
        console.log('对方离开房间');
        this.closeConnection();
        if (this.onPeerDisconnected) {
          this.onPeerDisconnected();
        }
        break;
      
      case 'offer':
        await this.handleOffer(message.sdp!);
        break;
      
      case 'answer':
        await this.handleAnswer(message.sdp!);
        break;
      
      case 'ice-candidate':
        await this.handleIceCandidate(message.candidate!);
        break;
    }
  }

  private async createOffer(): Promise<void> {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });

      // 创建数据通道
      this.dataChannel = this.peerConnection.createDataChannel('file-transfer', {
        ordered: true,
      });
      this.setupDataChannel(this.dataChannel);

      // 监听 ICE candidate
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          SignalService.send({
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // 创建 offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      SignalService.send({
        type: 'offer',
        sdp: offer.sdp,
      });
    } catch (error) {
      console.error('创建 offer 错误:', error);
    }
  }

  private async handleOffer(sdp: string): Promise<void> {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });

      // 监听数据通道
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };

      // 监听 ICE candidate
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          SignalService.send({
            type: 'ice-candidate',
            candidate: event.candidate.toJSON(),
          });
        }
      };

      // 设置远程描述
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));

      // 创建 answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      SignalService.send({
        type: 'answer',
        sdp: answer.sdp,
      });
    } catch (error) {
      console.error('处理 offer 错误:', error);
    }
  }

  private async handleAnswer(sdp: string): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
      }
    } catch (error) {
      console.error('处理 answer 错误:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (this.peerConnection) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('处理 ICE candidate 错误:', error);
    }
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('DataChannel 已打开');
      if (this.onPeerConnected) {
        this.onPeerConnected();
      }
    };

    channel.onclose = () => {
      console.log('DataChannel 已关闭');
      if (this.onPeerDisconnected) {
        this.onPeerDisconnected();
      }
    };

    channel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data);
    };

    // 监听缓冲低事件，实现背压控制
    channel.onbufferedamountlow = () => {
      console.log('DataChannel 缓冲区已清空');
    };
  }

  private handleDataChannelMessage(data: any): void {
    try {
      // 尝试解析为 JSON（控制消息）
      if (typeof data === 'string') {
        const message = JSON.parse(data);
        this.handleControlMessage(message);
      } else if (data instanceof ArrayBuffer) {
        // 文件数据块
        this.handleFileChunkData(data);
      }
    } catch (error) {
      console.error('处理 DataChannel 消息错误:', error);
    }
  }

  private handleControlMessage(message: any): void {
    switch (message.type) {
      case 'file-info':
        const fileRequest: FileTransferRequest = {
          fileId: message.fileId,
          fileName: message.fileName,
          fileSize: message.fileSize,
          fileType: message.fileType,
        };
        this.pendingFileRequests.set(fileRequest.fileId, fileRequest);
        if (this.onFileRequest) {
          this.onFileRequest(fileRequest);
        }
        break;
      
      case 'file-accept':
        this.handleFileAccept(message.fileId);
        break;
      
      case 'file-reject':
        this.handleFileReject(message.fileId);
        break;
      
      case 'file-chunk-info':
        // 文件块信息（用于接收端准备接收）
        this.prepareFileReceive(message);
        break;
      
      case 'file-complete':
        this.handleFileComplete(message.fileId);
        break;
    }
  }

  private handleFileChunkData(data: ArrayBuffer): void {
    // 从数据中提取文件ID和块索引
    // 数据格式：前 4 字节是文件ID长度，接着是文件ID，接着是 4 字节的块索引，剩下的是文件数据
    const view = new DataView(data);
    const fileIdLength = view.getUint32(0);
    
    const fileIdBytes = new Uint8Array(data, 4, fileIdLength);
    const fileId = new TextDecoder().decode(fileIdBytes);
    
    const chunkIndex = view.getUint32(4 + fileIdLength);
    
    const chunkData = data.slice(4 + fileIdLength + 4);

    let buffer = this.receiveBuffers.get(fileId);
    if (!buffer) {
      console.error('未找到文件缓冲区:', fileId);
      return;
    }

    buffer.chunks[chunkIndex] = chunkData;
    buffer.receivedChunks++;

    // 更新进度
    if (this.onProgress) {
      this.onProgress({
        fileId,
        transferred: buffer.receivedChunks,
        total: buffer.totalChunks,
        status: 'transferring',
      });
    }

    // 检查是否接收完成
    if (buffer.receivedChunks === buffer.totalChunks) {
      this.assembleFile(fileId);
    }
  }

  private prepareFileReceive(message: any): void {
    const { fileId, totalChunks, fileName, fileType } = message;
    
    this.receiveBuffers.set(fileId, {
      chunks: new Array(totalChunks),
      totalChunks,
      receivedChunks: 0,
      fileName,
      fileType,
    });

    console.log('准备接收文件:', fileName, '总块数:', totalChunks);
  }

  sendFile(file: File): string {
    const fileId = Math.random().toString(36).substring(2, 15);
    
    // 保存文件信息
    this.fileTransfers.set(fileId, { file, chunks: [] });

    // 通过 DataChannel 发送文件信息
    this.sendControlMessage({
      type: 'file-info',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    console.log('发送文件信息:', file.name, 'fileId:', fileId);
    return fileId;
  }

  private sendControlMessage(message: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    } else {
      console.error('DataChannel 未打开，无法发送控制消息');
    }
  }

  private async sendFileChunks(fileId: string): Promise<void> {
    const transfer = this.fileTransfers.get(fileId);
    if (!transfer) {
      console.error('未找到文件传输任务:', fileId);
      return;
    }

    const { file } = transfer;
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

    // 发送文件块信息
    this.sendControlMessage({
      type: 'file-chunk-info',
      fileId,
      totalChunks,
      fileName: file.name,
      fileType: file.type,
    });

    // 等待一小段时间确保对方准备好接收
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let i = 0; i < totalChunks; i++) {
      // 检查 DataChannel 缓冲区，实现背压控制
      if (this.dataChannel && this.dataChannel.bufferedAmount > 16 * 1024 * 1024) {
        // 缓冲区超过 16MB，等待缓冲区清空
        await new Promise(resolve => {
          if (this.dataChannel) {
            this.dataChannel.onbufferedamountlow = resolve;
          }
        });
      }

      const start = i * this.CHUNK_SIZE;
      const end = Math.min(start + this.CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const arrayBuffer = await chunk.arrayBuffer();
      
      // 构造数据包：文件ID长度(4字节) + 文件ID + 块索引(4字节) + 文件数据
      const fileIdBytes = new TextEncoder().encode(fileId);
      const headerSize = 4 + fileIdBytes.length + 4;
      const totalSize = headerSize + arrayBuffer.byteLength;
      
      const packet = new ArrayBuffer(totalSize);
      const view = new DataView(packet);
      
      // 写入文件ID长度
      view.setUint32(0, fileIdBytes.length);
      
      // 写入文件ID
      new Uint8Array(packet, 4, fileIdBytes.length).set(fileIdBytes);
      
      // 写入块索引
      view.setUint32(4 + fileIdBytes.length, i);
      
      // 写入文件数据
      new Uint8Array(packet, headerSize).set(new Uint8Array(arrayBuffer));

      // 通过 DataChannel 发送
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(packet);
      } else {
        console.error('DataChannel 未打开，停止传输');
        break;
      }

      // 更新进度
      if (this.onProgress) {
        this.onProgress({
          fileId,
          transferred: i + 1,
          total: totalChunks,
          status: 'transferring',
        });
      }
    }

    // 发送完成信号
    this.sendControlMessage({
      type: 'file-complete',
      fileId,
    });

    console.log('文件发送完成:', file.name);
  }

  acceptFile(fileId: string): void {
    this.sendControlMessage({
      type: 'file-accept',
      fileId,
    });

    // 开始接收文件
    const fileRequest = this.pendingFileRequests.get(fileId);
    if (fileRequest) {
      // 准备接收缓冲区
      this.receiveBuffers.set(fileId, {
        chunks: [],
        totalChunks: 0,
        receivedChunks: 0,
        fileName: fileRequest.fileName,
        fileType: fileRequest.fileType,
      });
    }
  }

  rejectFile(fileId: string): void {
    this.sendControlMessage({
      type: 'file-reject',
      fileId,
    });
    this.pendingFileRequests.delete(fileId);
  }

  startFileTransfer(fileId: string): void {
    const transfer = this.fileTransfers.get(fileId);
    if (transfer) {
      this.sendFileChunks(fileId);
    }
  }

  private handleFileAccept(fileId: string): void {
    console.log('对方接受文件:', fileId);
    // 开始发送文件块
    this.startFileTransfer(fileId);
  }

  private handleFileReject(fileId: string): void {
    console.log('对方拒绝文件:', fileId);
    this.fileTransfers.delete(fileId);
    if (this.onProgress) {
      this.onProgress({
        fileId,
        transferred: 0,
        total: 0,
        status: 'failed',
      });
    }
  }

  private handleFileComplete(fileId: string): void {
    console.log('文件传输完成:', fileId);
    // 文件接收完成，组装文件
    this.assembleFile(fileId);
  }

  private assembleFile(fileId: string): void {
    const buffer = this.receiveBuffers.get(fileId);
    if (!buffer) return;

    // 组装文件
    const blob = new Blob(buffer.chunks, { type: buffer.fileType });
    
    if (this.onFileReceived) {
      this.onFileReceived({
        fileId,
        fileName: buffer.fileName,
        fileType: buffer.fileType,
        data: blob,
      });
    }

    // 清理
    this.receiveBuffers.delete(fileId);
    this.pendingFileRequests.delete(fileId);
  }

  private closeConnection(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  disconnect(): void {
    this.closeConnection();
    SignalService.disconnect();
  }
}

export default new WebRTCService();
