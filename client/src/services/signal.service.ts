import { SignalMessage } from '../types/webrtc.types';

class SignalService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: SignalMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  constructor() {}

  connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
          console.log('信令服务器连接成功');
          this.connectionHandlers.forEach(handler => handler(true));
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: SignalMessage = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('信令消息解析错误:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('信令服务器连接关闭');
          this.connectionHandlers.forEach(handler => handler(false));
        };

        this.ws.onerror = (error) => {
          console.error('信令服务器错误:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: SignalMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket 未连接');
    }
  }

  onMessage(handler: (message: SignalMessage) => void): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onConnectionChange(handler: (connected: boolean) => void): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export default new SignalService();