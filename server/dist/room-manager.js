"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.peerRoomMap = new Map(); // WebSocket -> roomCode
        this.ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes
        // 定期清理过期房间
        setInterval(() => this.cleanupExpiredRooms(), 60 * 1000);
    }
    /**
     * 加入房间
     * @returns 房间内已有的 peers（不包括新加入的）
     */
    joinRoom(roomCode, ws) {
        let room = this.rooms.get(roomCode);
        const peerId = this.generatePeerId();
        if (!room) {
            // 创建新房间
            room = {
                code: roomCode,
                peers: new Set(),
                createdAt: Date.now(),
                peerIds: new Map(),
            };
            this.rooms.set(roomCode, room);
        }
        // 检查房间是否已满
        if (room.peers.size >= 2) {
            return { success: false, peers: [], peerId: '' };
        }
        // 加入房间
        room.peers.add(ws);
        room.peerIds.set(ws, peerId);
        this.peerRoomMap.set(ws, roomCode);
        // 返回房间内其他 peers
        const otherPeers = Array.from(room.peers).filter(peer => peer !== ws);
        return { success: true, peers: otherPeers, peerId };
    }
    leaveRoom(ws) {
        const roomCode = this.peerRoomMap.get(ws);
        if (!roomCode)
            return null;
        const room = this.rooms.get(roomCode);
        if (room) {
            room.peers.delete(ws);
            room.peerIds.delete(ws);
            // 如果房间为空，删除房间
            if (room.peers.size === 0) {
                this.rooms.delete(roomCode);
            }
        }
        this.peerRoomMap.delete(ws);
        return roomCode;
    }
    getRoom(roomCode) {
        return this.rooms.get(roomCode);
    }
    getPeerId(ws) {
        const roomCode = this.peerRoomMap.get(ws);
        if (!roomCode)
            return undefined;
        const room = this.rooms.get(roomCode);
        return room?.peerIds.get(ws);
    }
    generatePeerId() {
        return Math.random().toString(36).substring(2, 15);
    }
    cleanupExpiredRooms() {
        const now = Date.now();
        for (const [code, room] of this.rooms.entries()) {
            if (now - room.createdAt > this.ROOM_TIMEOUT) {
                // 通知房间内所有 peers
                for (const peer of room.peers) {
                    if (peer.readyState === ws_1.WebSocket.OPEN) {
                        peer.send(JSON.stringify({ type: 'room-timeout' }));
                    }
                }
                this.rooms.delete(code);
            }
        }
    }
}
exports.default = RoomManager;
