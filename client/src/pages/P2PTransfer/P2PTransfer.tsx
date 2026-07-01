import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoomJoin from './components/RoomJoin';
import FileTransfer from './components/FileTransfer';
import PeerStatus from './components/PeerStatus';
import WebRTCService from '../../services/webrtc.service';

const P2PTransfer = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string>('');

  useEffect(() => {
    // 设置 WebRTC 事件回调
    WebRTCService.onPeerConnected = () => {
      setIsConnected(true);
    };

    WebRTCService.onPeerDisconnected = () => {
      setIsConnected(false);
    };

    return () => {
      // 组件卸载时断开连接
      WebRTCService.disconnect();
    };
  }, []);

  const handleJoinRoom = async (code: string) => {
    setRoomCode(code);
    try {
      await WebRTCService.joinRoom(code);
    } catch (error) {
      console.error('加入房间失败:', error);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 顶部：返回按钮 + 页面标题 */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => {
              WebRTCService.disconnect();
              navigate('/apps');
            }}
            className="mr-4 text-gray-700 hover:text-primary transition-colors duration-200"
          >
            ← 返回
          </button>
          <h1 className="text-3xl font-bold text-gray-900">P2P 文件传输</h1>
        </div>

        {/* 连接状态显示 */}
        <PeerStatus isConnected={isConnected} roomCode={roomCode} />

        {!isConnected ? (
          /* 未连接时：显示加入房间界面 */
          <RoomJoin onJoinRoom={handleJoinRoom} />
        ) : (
          /* 连接后：显示文件传输界面 */
          <FileTransfer roomCode={roomCode} />
        )}
      </div>
    </div>
  );
};

export default P2PTransfer;