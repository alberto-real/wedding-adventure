import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface RoomState {
  roomId: string | null;
  players: string[];
  gameType: string | null;
  status: 'idle' | 'joining' | 'waiting' | 'ready' | 'closed';
  error: string | null;
}

@Injectable()
export class GameRoomService implements OnDestroy {
  private socket: Socket | null = null;

  private readonly _state = signal<RoomState>({
    roomId: null,
    players: [],
    gameType: null,
    status: 'idle',
    error: null,
  });

  readonly state = this._state.asReadonly();
  readonly roomId = computed(() => this._state().roomId);
  readonly players = computed(() => this._state().players);
  readonly status = computed(() => this._state().status);
  readonly error = computed(() => this._state().error);
  readonly isReady = computed(() => this._state().status === 'ready');
  readonly playerCount = computed(() => this._state().players.length);

  private activityInterval: ReturnType<typeof setInterval> | null = null;

  private getSocketUrl(): string {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:3000/game'
      : `${window.location.origin}/game`;
  }

  private connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.getSocketUrl(), {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('room-created', (data: { roomId: string; players: string[] }) => {
      this._state.update((s) => ({
        ...s,
        roomId: data.roomId,
        players: data.players,
        status: data.players.length >= 2 ? 'ready' : 'waiting',
        error: null,
      }));
      this.startActivityPing();
    });

    this.socket.on('player-joined', (data: { playerName: string; players: string[] }) => {
      this._state.update((s) => ({
        ...s,
        players: data.players,
        status: data.players.length >= 2 ? 'ready' : 'waiting',
      }));
    });

    this.socket.on('player-left', (data: { playerName: string; players: string[] }) => {
      this._state.update((s) => ({
        ...s,
        players: data.players,
        status: data.players.length >= 2 ? 'ready' : 'waiting',
      }));
    });

    this.socket.on('room-error', (data: { message: string }) => {
      this._state.update((s) => ({
        ...s,
        status: 'idle',
        error: data.message,
      }));
    });

    this.socket.on('room-closed', () => {
      this._state.update((s) => ({
        ...s,
        roomId: null,
        players: [],
        status: 'closed',
      }));
      this.stopActivityPing();
    });

    this.socket.on('game-reset', () => {
      // Emit a signal that components can react to
      this._state.update((s) => ({ ...s }));
    });

    this.socket.on('disconnect', () => {
      this._state.update((s) => ({
        ...s,
        status: s.roomId ? 'closed' : 'idle',
      }));
      this.stopActivityPing();
    });
  }

  createRoom(gameType: string, playerName: string): void {
    this.connect();
    this._state.update((s) => ({
      ...s,
      gameType,
      status: 'joining',
      error: null,
    }));
    this.socket!.emit('create-room', { gameType, playerName });
  }

  joinRoom(roomId: string, playerName: string): void {
    this.connect();
    this._state.update((s) => ({
      ...s,
      roomId,
      status: 'joining',
      error: null,
    }));
    this.socket!.emit('join-room', { roomId, playerName });
  }

  leaveRoom(): void {
    const roomId = this._state().roomId;
    if (roomId && this.socket) {
      this.socket.emit('leave-room', { roomId });
    }
    this.reset();
  }

  resetGame(): void {
    const roomId = this._state().roomId;
    if (roomId && this.socket) {
      this.socket.emit('reset-game', { roomId });
    }
  }

  sendGameEvent(event: string, payload: unknown): void {
    const roomId = this._state().roomId;
    if (roomId && this.socket) {
      this.socket.emit('game-event', { roomId, event, payload });
    }
  }

  onGameEvent(callback: (data: { event: string; payload: unknown; from: string }) => void): void {
    this.socket?.on('game-event', callback);
  }

  onGameReset(callback: () => void): void {
    this.socket?.on('game-reset', callback);
  }

  private startActivityPing(): void {
    this.stopActivityPing();
    // Send activity ping every 30 seconds to prevent inactivity timeout
    this.activityInterval = setInterval(() => {
      const roomId = this._state().roomId;
      if (roomId && this.socket) {
        this.socket.emit('room-activity', { roomId });
      }
    }, 30000);
  }

  private stopActivityPing(): void {
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
      this.activityInterval = null;
    }
  }

  private reset(): void {
    this.stopActivityPing();
    this._state.set({
      roomId: null,
      players: [],
      gameType: null,
      status: 'idle',
      error: null,
    });
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.leaveRoom();
  }
}
