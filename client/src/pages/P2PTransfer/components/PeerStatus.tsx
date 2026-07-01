import { Wifi, WifiOff } from 'lucide-react';

interface PeerStatusProps {
  isConnected: boolean;
  roomCode: string;
}

const PeerStatus = ({ isConnected, roomCode }: PeerStatusProps) => {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isConnected ? (
            <>
              <Wifi size={20} className="text-green-500" />
              <span className="text-green-600 font-medium">已连接</span>
            </>
          ) : (
            <>
              <WifiOff size={20} className="text-gray-400" />
              <span className="text-gray-600 font-medium">未连接</span>
            </>
          )}
        </div>
        
        {isConnected && roomCode && (
          <div className="text-sm text-gray-600">
            房间号：<span className="font-mono font-medium text-primary">{roomCode}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerStatus;