import { useState } from 'react';
import { Link2 } from 'lucide-react';

interface RoomJoinProps {
  onJoinRoom: (roomCode: string) => void;
}

const RoomJoin = ({ onJoinRoom }: RoomJoinProps) => {
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onJoinRoom(roomCode.trim());
    }
  };

  const handleCreateRoom = () => {
    // 生成随机房间号
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(randomCode);
    setIsCreating(true);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <Link2 size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">加入传输房间</h2>
          <p className="text-gray-600 mt-2">
            输入房间号与对方建立连接，或创建新房间
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
              房间号
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="输入房间号或点击生成"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={!roomCode.trim()}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            加入房间
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleCreateRoom}
            className="text-primary hover:text-primary-dark font-medium transition-colors duration-200"
          >
            生成随机房间号
          </button>
        </div>

        {isCreating && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              房间号已生成：<span className="font-bold text-primary">{roomCode}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              请让对方输入相同的房间号加入
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomJoin;