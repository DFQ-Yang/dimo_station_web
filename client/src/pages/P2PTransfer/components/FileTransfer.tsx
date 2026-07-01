import { useState, useEffect, useRef } from 'react';
import WebRTCService from '../../../services/webrtc.service';
import { FileTransferRequest } from '../../../types/webrtc.types';

interface FileTransferProps {
  roomCode: string;
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'waiting-confirm' | 'transferring' | 'completed' | 'rejected';
  progress: number;
  data?: Blob;
}

const FileTransfer = ({ roomCode }: FileTransferProps) => {
  const [sendFiles, setSendFiles] = useState<FileItem[]>([]);
  const [receiveFiles, setReceiveFiles] = useState<FileItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 监听文件请求
    WebRTCService.onFileRequest = (fileRequest: FileTransferRequest) => {
      setPendingFiles(prev => [...prev, {
        id: fileRequest.fileId,
        name: fileRequest.fileName,
        size: fileRequest.fileSize,
        type: fileRequest.fileType,
        status: 'waiting-confirm',
        progress: 0,
      }]);
    };

    // 监听文件接收完成
    WebRTCService.onFileReceived = (file) => {
      setReceiveFiles(prev => {
        const existing = prev.find(f => f.id === file.fileId);
        if (existing) {
          return prev.map(f => 
            f.id === file.fileId 
              ? { ...f, status: 'completed', progress: 100, data: file.data }
              : f
          );
        } else {
          return [...prev, {
            id: file.fileId,
            name: file.fileName,
            size: file.data.size,
            type: file.fileType,
            status: 'completed',
            progress: 100,
            data: file.data,
          }];
        }
      });
    };

    // 监听传输进度
    WebRTCService.onProgress = (progress) => {
      const { fileId, transferred, total, status } = progress;
      
      // 更新发送文件进度
      setSendFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: Math.round((transferred / total) * 100), status: status === 'transferring' ? 'transferring' : f.status }
            : f
        )
      );

      // 更新接收文件进度
      setReceiveFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: Math.round((transferred / total) * 100), status: status === 'transferring' ? 'transferring' : f.status }
            : f
        )
      );
    };

    return () => {
      WebRTCService.onFileRequest = null;
      WebRTCService.onFileReceived = null;
      WebRTCService.onProgress = null;
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: FileItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = WebRTCService.sendFile(file);
      
      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
      });
    }

    setSendFiles(prev => [...prev, ...newFiles]);
    
    // 清空 input 以支持选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAcceptFile = (fileId: string) => {
    WebRTCService.acceptFile(fileId);
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
    setReceiveFiles(prev => [...prev, { 
      ...pendingFiles.find(f => f.id === fileId)!, 
      status: 'transferring',
      progress: 0,
    }]);
  };

  const handleRejectFile = (fileId: string) => {
    WebRTCService.rejectFile(fileId);
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleDownload = (file: FileItem) => {
    if (!file.data) return;
    
    const url = URL.createObjectURL(file.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 左侧：文件发送区域 */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">发送文件</h2>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors duration-200 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="text-gray-500">
            <p className="text-lg mb-2">点击选择文件</p>
            <p className="text-sm">或拖拽文件到此处</p>
          </div>
        </div>
        
        {/* 待发送/发送中的文件列表 */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">文件列表</h3>
          {sendFiles.length === 0 ? (
            <p className="text-sm text-gray-500">暂无文件</p>
          ) : (
            <div className="space-y-2">
              {sendFiles.map(file => (
                <div key={file.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <span className={`text-xs ml-2 ${
                      file.status === 'completed' ? 'text-green-500' :
                      file.status === 'transferring' ? 'text-blue-500' :
                      file.status === 'rejected' ? 'text-red-500' :
                      'text-gray-500'
                    }`}>
                      {file.status === 'pending' ? '等待确认' :
                       file.status === 'transferring' ? '传输中' :
                       file.status === 'completed' ? '已完成' :
                       file.status === 'rejected' ? '已拒绝' : file.status}
                    </span>
                  </div>
                  {file.status === 'transferring' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：文件接收区域 */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">接收文件</h2>
        
        {/* 待确认文件列表 */}
        {pendingFiles.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">待确认文件</h3>
            <div className="space-y-2">
              {pendingFiles.map(file => (
                <div key={file.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptFile(file.id)}
                      className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors duration-200"
                    >
                      接受
                    </button>
                    <button
                      onClick={() => handleRejectFile(file.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors duration-200"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 接收中的文件列表 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">接收中的文件</h3>
          {receiveFiles.length === 0 ? (
            <p className="text-sm text-gray-500">暂无接收中的文件</p>
          ) : (
            <div className="space-y-2">
              {receiveFiles.map(file => (
                <div key={file.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <span className={`text-xs ml-2 ${
                      file.status === 'completed' ? 'text-green-500' :
                      file.status === 'transferring' ? 'text-blue-500' :
                      'text-gray-500'
                    }`}>
                      {file.status === 'transferring' ? '接收中' :
                       file.status === 'completed' ? '已完成' : file.status}
                    </span>
                  </div>
                  {file.status === 'transferring' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                  {file.status === 'completed' && file.data && (
                    <button
                      onClick={() => handleDownload(file)}
                      className="text-sm text-primary hover:text-primary-dark transition-colors duration-200"
                    >
                      下载文件
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileTransfer;
