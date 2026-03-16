import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN;

/** Configurable inactivity timeout in ms (default: 60 seconds) */
const ROOM_INACTIVITY_TIMEOUT_MS = parseInt(
  process.env.ROOM_INACTIVITY_TIMEOUT_MS ?? '60000',
  10,
);
const MAX_PLAYERS_PER_ROOM = 2;

interface Player {
  socketId: string;
  name: string;
}

interface GameRoom {
  id: string;
  gameType: string;
  players: Player[];
  readyPlayers: Set<string>;
  inactivityTimer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

@WebSocketGateway({
  namespace: '/game',
  cors: isProduction
    ? (corsOrigin ? { origin: corsOrigin.split(',') } : false)
    : { origin: true },
})
export class GameRoomGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private rooms = new Map<string, GameRoom>();

  handleDisconnect(client: Socket) {
    for (const [roomId, room] of this.rooms) {
      const playerIndex = room.players.findIndex(
        (p) => p.socketId === client.id,
      );
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        this.server.to(roomId).emit('player-left', {
          playerName: player.name,
          players: room.players.map((p) => p.name),
        });

        if (room.players.length === 0) {
          this.destroyRoom(roomId);
        } else {
          this.resetInactivityTimer(roomId);
        }
      }
    }
  }

  @SubscribeMessage('create-room')
  handleCreateRoom(
    @MessageBody() data: { gameType: string; playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.generateRoomId();
    const room: GameRoom = {
      id: roomId,
      gameType: data.gameType,
      players: [{ socketId: client.id, name: data.playerName }],
      readyPlayers: new Set(),
      inactivityTimer: null,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    client.join(roomId);
    this.resetInactivityTimer(roomId);

    client.emit('room-created', {
      roomId,
      players: [data.playerName],
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; playerName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomId);

    if (!room) {
      client.emit('room-error', { message: 'ROOM_NOT_FOUND' });
      return;
    }

    if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
      client.emit('room-error', { message: 'ROOM_FULL' });
      return;
    }

    if (room.players.some((p) => p.socketId === client.id)) {
      client.emit('room-error', { message: 'ALREADY_IN_ROOM' });
      return;
    }

    room.players.push({ socketId: client.id, name: data.playerName });
    client.join(data.roomId);
    this.resetInactivityTimer(data.roomId);

    this.server.to(data.roomId).emit('player-joined', {
      playerName: data.playerName,
      players: room.players.map((p) => p.name),
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(
      (p) => p.socketId === client.id,
    );
    if (playerIndex === -1) return;

    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    client.leave(data.roomId);

    this.server.to(data.roomId).emit('player-left', {
      playerName: player.name,
      players: room.players.map((p) => p.name),
    });

    if (room.players.length === 0) {
      this.destroyRoom(data.roomId);
    } else {
      this.resetInactivityTimer(data.roomId);
    }
  }

  @SubscribeMessage('room-activity')
  handleRoomActivity(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room) return;
    if (!room.players.some((p) => p.socketId === client.id)) return;

    this.resetInactivityTimer(data.roomId);
  }

  @SubscribeMessage('player-ready')
  handlePlayerReady(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === client.id);
    if (!player) return;

    room.readyPlayers.add(player.name);
    this.resetInactivityTimer(data.roomId);

    this.server.to(data.roomId).emit('player-ready', {
      playerName: player.name,
      readyPlayers: Array.from(room.readyPlayers),
    });

    if (room.readyPlayers.size >= MAX_PLAYERS_PER_ROOM && room.players.length >= MAX_PLAYERS_PER_ROOM) {
      this.server.to(data.roomId).emit('game-start');
      room.readyPlayers.clear();
    }
  }

  @SubscribeMessage('reset-game')
  handleResetGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room) return;
    if (!room.players.some((p) => p.socketId === client.id)) return;

    room.readyPlayers.clear();
    this.resetInactivityTimer(data.roomId);
    this.server.to(data.roomId).emit('game-reset', {
      roomId: data.roomId,
      gameType: room.gameType,
    });
  }

  @SubscribeMessage('game-event')
  handleGameEvent(
    @MessageBody() data: { roomId: string; event: string; payload: unknown },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.rooms.get(data.roomId);
    if (!room) return;
    if (!room.players.some((p) => p.socketId === client.id)) return;

    this.resetInactivityTimer(data.roomId);

    // Broadcast game event to all players in the room
    this.server.to(data.roomId).emit('game-event', {
      event: data.event,
      payload: data.payload,
      from: room.players.find((p) => p.socketId === client.id)?.name,
    });
  }

  private resetInactivityTimer(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.inactivityTimer) {
      clearTimeout(room.inactivityTimer);
    }

    room.inactivityTimer = setTimeout(() => {
      this.server.to(roomId).emit('room-closed', {
        reason: 'INACTIVITY_TIMEOUT',
      });
      this.destroyRoom(roomId);
    }, ROOM_INACTIVITY_TIMEOUT_MS);
  }

  private destroyRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.inactivityTimer) {
      clearTimeout(room.inactivityTimer);
    }

    // Disconnect remaining sockets from the room
    for (const player of room.players) {
      const socket = this.server.sockets.sockets.get(player.socketId);
      socket?.leave(roomId);
    }

    this.rooms.delete(roomId);
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure uniqueness
    return this.rooms.has(result) ? this.generateRoomId() : result;
  }
}
