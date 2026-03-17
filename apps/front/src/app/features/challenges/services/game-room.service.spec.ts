import { TestBed } from '@angular/core/testing';
import { GameRoomService } from './game-room.service';
import { io } from 'socket.io-client';
import { ToastService } from '../../../core/services/toast.service';
import { TranslateService } from '@ngx-translate/core';

vi.mock('socket.io-client', () => {
  const socketMock = {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    ioSocket: { connected: false }
  };
  return {
    io: vi.fn().mockReturnValue(socketMock)
  };
});

describe('GameRoomService', () => {
  let service: GameRoomService;
  let socketMock: { on: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; connected: boolean; ioSocket: { connected: boolean } };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    socketMock = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connected: false,
      ioSocket: { connected: false }
    };
    vi.mocked(io).mockReturnValue(socketMock as unknown as ReturnType<typeof io>);

    TestBed.configureTestingModule({
      providers: [
        GameRoomService,
        ToastService,
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
      ]
    });
    service = TestBed.inject(GameRoomService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct initial state', () => {
    expect(service.status()).toBe('idle');
    expect(service.roomId()).toBeNull();
    expect(service.players()).toEqual([]);
    expect(service.error()).toBeNull();
    expect(service.isReady()).toBe(false);
    expect(service.playerCount()).toBe(0);
    expect(service.localPlayerName()).toBeNull();
  });

  it('should create a room', () => {
    service.createRoom('ski', 'TestPlayer');
    expect(io).toHaveBeenCalled();
    expect(socketMock.emit).toHaveBeenCalledWith('create-room', { gameType: 'ski', playerName: 'TestPlayer' });
    expect(service.status()).toBe('joining');
    expect(service.localPlayerName()).toBe('TestPlayer');
  });

  it('should join a room', () => {
    service.joinRoom('ROOM123', 'TestPlayer');
    expect(socketMock.emit).toHaveBeenCalledWith('join-room', { roomId: 'ROOM123', playerName: 'TestPlayer' });
    expect(service.status()).toBe('joining');
    expect(service.localPlayerName()).toBe('TestPlayer');
  });

  it('should handle room created event with one player (waiting)', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];

    onCreated({ roomId: 'R1', players: ['P1'] });
    expect(service.roomId()).toBe('R1');
    expect(service.status()).toBe('waiting');
    expect(service.players()).toEqual(['P1']);
  });

  it('should handle room created event with two players (ready)', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];

    onCreated({ roomId: 'R1', players: ['P1', 'P2'] });
    expect(service.status()).toBe('ready');
    expect(service.isReady()).toBe(true);
    expect(service.playerCount()).toBe(2);
  });

  it('should handle player joined event', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    const onJoined = socketMock.on.mock.calls.find(c => c[0] === 'player-joined')![1];
    onJoined({ playerName: 'P2', players: ['P1', 'P2'] });

    expect(service.players()).toEqual(['P1', 'P2']);
    expect(service.status()).toBe('ready');
  });

  it('should handle player left event', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1', 'P2'] });

    const onLeft = socketMock.on.mock.calls.find(c => c[0] === 'player-left')![1];
    onLeft({ playerName: 'P2', players: ['P1'] });

    expect(service.players()).toEqual(['P1']);
    expect(service.status()).toBe('waiting');
  });

  it('should handle room error', () => {
    service.joinRoom('R1', 'P1');
    const onError = socketMock.on.mock.calls.find(c => c[0] === 'room-error')![1];

    onError({ message: 'Error msg' });
    expect(service.error()).toBe('Error msg');
    expect(service.status()).toBe('idle');
  });

  it('should handle room closed', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    const onClosed = socketMock.on.mock.calls.find(c => c[0] === 'room-closed')![1];
    onClosed();
    expect(service.status()).toBe('closed');
    expect(service.roomId()).toBeNull();
    expect(service.players()).toEqual([]);
  });

  it('should handle game-reset event on socket', () => {
    service.createRoom('ski', 'P1');
    const onReset = socketMock.on.mock.calls.find(c => c[0] === 'game-reset' && typeof c[1] === 'function')!;
    expect(onReset).toBeTruthy();
    onReset[1]();
  });

  it('should handle disconnect event with room', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    const onDisconnect = socketMock.on.mock.calls.find(c => c[0] === 'disconnect')![1];
    onDisconnect('transport close');
    expect(service.status()).toBe('closed');
  });

  it('should handle disconnect event without room', () => {
    service.createRoom('ski', 'P1');
    const onDisconnect = socketMock.on.mock.calls.find(c => c[0] === 'disconnect')![1];
    onDisconnect('transport close');
    expect(service.status()).toBe('idle');
  });

  it('should send game events', () => {
    service.joinRoom('R1', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    service.sendGameEvent('move', { x: 10 });
    expect(socketMock.emit).toHaveBeenCalledWith('game-event', { roomId: 'R1', event: 'move', payload: { x: 10 } });
  });

  it('should not send game events without room', () => {
    service.sendGameEvent('move', { x: 10 });
    expect(socketMock.emit).not.toHaveBeenCalled();
  });

  it('should leave room', () => {
    service.joinRoom('R1', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    service.leaveRoom();
    expect(socketMock.emit).toHaveBeenCalledWith('leave-room', { roomId: 'R1' });
    expect(socketMock.disconnect).toHaveBeenCalled();
    expect(service.roomId()).toBeNull();
    expect(service.localPlayerName()).toBeNull();
  });

  it('should handle leaveRoom when not in room', () => {
    service.leaveRoom();
    expect(service.status()).toBe('idle');
  });

  it('should reset game', () => {
    service.joinRoom('R1', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    service.resetGame();
    expect(socketMock.emit).toHaveBeenCalledWith('reset-game', { roomId: 'R1' });
  });

  it('should not reset game without room', () => {
    service.resetGame();
    expect(socketMock.emit).not.toHaveBeenCalled();
  });

  it('should register onGameEvent callback on socket', () => {
    service.createRoom('ski', 'P1');
    const cb = vi.fn();
    service.onGameEvent(cb);
    expect(socketMock.on).toHaveBeenCalledWith('game-event', cb);
  });

  it('should queue onGameEvent callback when no socket', () => {
    const cb = vi.fn();
    service.onGameEvent(cb);
    service.createRoom('ski', 'P1');
    expect(socketMock.on).toHaveBeenCalledWith('game-event', cb);
  });

  it('should register onGameReset callback on socket', () => {
    service.createRoom('ski', 'P1');
    const cb = vi.fn();
    service.onGameReset(cb);
    expect(socketMock.on).toHaveBeenCalledWith('game-reset', cb);
  });

  it('should queue onGameReset callback when no socket', () => {
    const cb = vi.fn();
    service.onGameReset(cb);
    service.createRoom('ski', 'P1');
    expect(socketMock.on).toHaveBeenCalledWith('game-reset', cb);
  });

  it('should not reconnect if already connected', () => {
    service.createRoom('ski', 'P1');
    socketMock.connected = true;
    const callCount = vi.mocked(io).mock.calls.length;
    service.joinRoom('R2', 'P2');
    expect(vi.mocked(io).mock.calls.length).toBe(callCount);
  });

  it('should start and stop activity ping', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    vi.advanceTimersByTime(30000);
    expect(socketMock.emit).toHaveBeenCalledWith('room-activity', { roomId: 'R1' });

    service.leaveRoom();
    socketMock.emit.mockClear();
    vi.advanceTimersByTime(30000);
    expect(socketMock.emit).not.toHaveBeenCalledWith('room-activity', expect.anything());
  });

  it('should mark player ready', () => {
    service.createRoom('ski', 'P1');
    const onCreated = socketMock.on.mock.calls.find(c => c[0] === 'room-created')![1];
    onCreated({ roomId: 'R1', players: ['P1'] });

    service.markReady();
    expect(socketMock.emit).toHaveBeenCalledWith('player-ready', { roomId: 'R1' });
  });

  it('should not mark ready without room', () => {
    service.markReady();
    expect(socketMock.emit).not.toHaveBeenCalled();
  });

  it('should update readyPlayers on player-ready event', () => {
    service.createRoom('ski', 'P1');
    const onPlayerReady = socketMock.on.mock.calls.find(c => c[0] === 'player-ready')![1];

    onPlayerReady({ playerName: 'P1', readyPlayers: ['P1'] });
    expect(service.readyPlayers()).toEqual(['P1']);
  });

  it('should clear readyPlayers on game-start event', () => {
    service.createRoom('ski', 'P1');
    const onPlayerReady = socketMock.on.mock.calls.find(c => c[0] === 'player-ready')![1];
    onPlayerReady({ playerName: 'P1', readyPlayers: ['P1'] });

    const onGameStart = socketMock.on.mock.calls.find(c => c[0] === 'game-start')![1];
    onGameStart();
    expect(service.readyPlayers()).toEqual([]);
  });

  it('should register onGameStart callback on socket', () => {
    service.createRoom('ski', 'P1');
    const cb = vi.fn();
    service.onGameStart(cb);
    expect(socketMock.on).toHaveBeenCalledWith('game-start', cb);
  });

  it('should queue onGameStart callback when no socket', () => {
    const cb = vi.fn();
    service.onGameStart(cb);
    service.createRoom('ski', 'P1');
    expect(socketMock.on).toHaveBeenCalledWith('game-start', cb);
  });

  it('should clear readyPlayers on game-reset event', () => {
    service.createRoom('ski', 'P1');
    const onPlayerReady = socketMock.on.mock.calls.find(c => c[0] === 'player-ready')![1];
    onPlayerReady({ playerName: 'P1', readyPlayers: ['P1'] });

    const onReset = socketMock.on.mock.calls.find(c => c[0] === 'game-reset' && typeof c[1] === 'function')!;
    onReset[1]();
    expect(service.readyPlayers()).toEqual([]);
  });

  it('should call leaveRoom on ngOnDestroy', () => {
    const spy = vi.spyOn(service, 'leaveRoom');
    service.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
