import { WebSocket } from 'ws';

export interface SignalMessage {
  type: 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate' | 'room-full' | 'peer-left' | 'file-info' | 'file-accept' | 'file-reject' | 'file-chunk' | 'file-complete';
  roomCode?: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  chunkIndex?: number;
  totalChunks?: number;
  data?: ArrayBuffer;
}

export interface Room {
  code: string;
  peers: Set<WebSocket>;
  createdAt: number;
  peerIds: Map<WebSocket, string>; // WebSocket -> peerId
}

export interface Peer {
  ws: WebSocket;
  peerId: string;
  roomCode?: string;
}