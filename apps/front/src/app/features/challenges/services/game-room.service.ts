import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { TranslateService } from '@ngx-translate/core';
import { ToastService } from '../../../core/services/toast.service';

export interface RoomState {
  roomId: string | null;
  players: string[];
  gameType: string | null;
  status: 'idle' | 'joining' | 'waiting' | 'ready' | 'closed';
  error: string | null;
}

const ERROR_TRANSLATION_MAP: Record<string, string> = {
  ROOM_NOT_FOUND: 'CHALLENGES.ERRORS.ROOM_NOT_FOUND',
  ROOM_FULL: 'CHALLENGES.ERRORS.ROOM_FULL',
  ALREADY_IN_ROOM: 'CHALLENGES.ERRORS.ALREADY_IN_ROOM',
};

@Injectable()
export class GameRoomService implements OnDestroy {
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private socket: Socket | null = null;

  private readonly _state = signal<RoomState>({
    roomId: null,
    players: [],
    gameType: null,
    status: 'idle',
    error: null,
  });

  readonly localPlayerName = signal<string | null>(null);

  readonly state = this._state.asReadonly();
  readonly roomId = computed(() => this._state().roomId);
  readonly players = computed(() => this._state().players);
  readonly status = computed(() => this._state().status);
  readonly error = computed(() => this._state().error);
  readonly isReady = computed(() => this._state().status === 'ready');
  readonly playerCount = computed(() => this._state().players.length);

  readonly readyPlayers = signal<string[]>([]);

  private activityInterval: ReturnType<typeof setInterval> | null = null;
  private pendingGameEventCbs: ((data: { event: string; payload: unknown; from: string }) => void)[] = [];
  private pendingGameResetCbs: (() => void)[] = [];
  private pendingGameStartCbs: (() => void)[] = [];

  private getSocketUrl(): string {
    const { hostname, protocol } = window.location;
    if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return `${protocol}//${hostname}:3000/game`;
    }
    return 'https://wedding-adventureback-production.up.railway.app/game';
  }

  private connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
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
      const translationKey = ERROR_TRANSLATION_MAP[data.message];
      if (translationKey) {
        this.showTranslatedToast(translationKey, 'error');
      }
    });

    this.socket.on('room-closed', (data?: { reason?: string }) => {
      this._state.update((s) => ({
        ...s,
        roomId: null,
        players: [],
        status: 'closed',
      }));
      this.stopActivityPing();
      if (data?.reason === 'INACTIVITY_TIMEOUT') {
        this.showTranslatedToast('CHALLENGES.ERRORS.INACTIVITY_TIMEOUT', 'warning');
      }
    });

    this.socket.on('player-ready', (data: { playerName: string; readyPlayers: string[] }) => {
      this.readyPlayers.set(data.readyPlayers);
    });

    this.socket.on('game-start', () => {
      this.readyPlayers.set([]);
    });

    this.socket.on('game-reset', () => {
      this.readyPlayers.set([]);
      this._state.update((s) => ({ ...s }));
    });

    this.socket.on('connect_error', () => {
      this._state.update((s) => ({
        ...s,
        status: 'idle',
        error: 'CONNECTION_FAILED',
      }));
      this.showTranslatedToast('CHALLENGES.ERRORS.CONNECTION_FAILED', 'error');
      this.stopActivityPing();
    });

    this.socket.on('disconnect', (reason: string) => {
      this._state.update((s) => ({
        ...s,
        status: s.roomId ? 'closed' : 'idle',
      }));
      this.stopActivityPing();
      // Only show toast for unexpected disconnects (not user-initiated)
      if (reason !== 'io client disconnect') {
        this.showTranslatedToast('CHALLENGES.ERRORS.CONNECTION_LOST', 'warning');
      }
    });

    // Register any callbacks that were queued before the socket existed
    for (const cb of this.pendingGameEventCbs) {
      this.socket.on('game-event', cb);
    }
    this.pendingGameEventCbs = [];
    for (const cb of this.pendingGameResetCbs) {
      this.socket.on('game-reset', cb);
    }
    this.pendingGameResetCbs = [];
    for (const cb of this.pendingGameStartCbs) {
      this.socket.on('game-start', cb);
    }
    this.pendingGameStartCbs = [];
  }

  createRoom(gameType: string, playerName: string): void {
    this.localPlayerName.set(playerName);
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
    this.localPlayerName.set(playerName);
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
    if (this.socket) {
      this.socket.on('game-event', callback);
    } else {
      this.pendingGameEventCbs.push(callback);
    }
  }

  onGameReset(callback: () => void): void {
    if (this.socket) {
      this.socket.on('game-reset', callback);
    } else {
      this.pendingGameResetCbs.push(callback);
    }
  }

  markReady(): void {
    const roomId = this._state().roomId;
    if (roomId && this.socket) {
      this.socket.emit('player-ready', { roomId });
    }
  }

  onGameStart(callback: () => void): void {
    if (this.socket) {
      this.socket.on('game-start', callback);
    } else {
      this.pendingGameStartCbs.push(callback);
    }
  }

  private showTranslatedToast(key: string, type: 'info' | 'warning' | 'error' | 'success'): void {
    const message = this.translate.instant(key);
    this.toastService.show(message, type);
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
    this.localPlayerName.set(null);
    this.readyPlayers.set([]);
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
