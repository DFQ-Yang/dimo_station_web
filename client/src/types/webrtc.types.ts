export interface SignalMessage {
  type: 'join' | 'leave' | 'joined' | 'peer-joined' | 'peer-left' | 'room-full' | 
        'offer' | 'answer' | 'ice-candidate';
  roomCode?: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  peerId?: string;
}

export interface FileTransferRequest {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface FileChunk {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: ArrayBuffer;
}

export interface TransferProgress {
  fileId: string;
  transferred: number;
  total: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'waiting-confirm';
}