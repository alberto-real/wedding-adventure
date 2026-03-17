import { GameRoomGateway } from './game-room.gateway';
import { GameRoomStore } from './game-room.store';

function createMockSocket(id = 'socket-1') {
  return {
    id,
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
  };
}

function createMockServer() {
  const roomEmit = jest.fn();
  return {
    to: jest.fn().mockReturnValue({ emit: roomEmit }),
    sockets: { sockets: new Map<string, { leave: jest.Mock }>() },
    _roomEmit: roomEmit,
  };
}

describe('GameRoomGateway', () => {
  let gateway: GameRoomGateway;
  let server: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    jest.useFakeTimers();
    gateway = new GameRoomGateway(new GameRoomStore());
    server = createMockServer();
    (gateway as unknown as { server: typeof server }).server = server;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper to create a room and return its id
  function createRoom(
    playerName = 'Alice',
    gameType = 'ski',
    socketId = 'socket-1',
  ) {
    const client = createMockSocket(socketId);
    gateway.handleCreateRoom(
      { gameType, playerName } as never,
      client as never,
    );
    const roomId = client.emit.mock.calls.find(
      (c: unknown[]) => c[0] === 'room-created',
    )?.[1]?.roomId as string;
    return { client, roomId };
  }

  describe('create-room', () => {
    it('should create a room and emit room-created to the creator', () => {
      const { client, roomId } = createRoom();

      expect(roomId).toBeDefined();
      expect(roomId).toHaveLength(6);
      expect(client.join).toHaveBeenCalledWith(roomId);
      expect(client.emit).toHaveBeenCalledWith('room-created', {
        roomId,
        players: ['Alice'],
      });
    });

    it('should generate unique room IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const { roomId } = createRoom('Player', 'ski', `socket-${i}`);
        ids.add(roomId);
      }
      expect(ids.size).toBe(20);
    });
  });

  describe('join-room', () => {
    it('should join an existing room and emit player-joined', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');

      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      expect(client2.join).toHaveBeenCalledWith(roomId);
      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('player-joined', {
        playerName: 'Bob',
        players: ['Alice', 'Bob'],
      });
    });

    it('should emit ROOM_NOT_FOUND for non-existent room', () => {
      const client = createMockSocket();

      gateway.handleJoinRoom(
        { roomId: 'ZZZZZZ', playerName: 'Bob' } as never,
        client as never,
      );

      expect(client.emit).toHaveBeenCalledWith('room-error', {
        message: 'ROOM_NOT_FOUND',
      });
    });

    it('should emit ROOM_FULL when room has max players', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      const client3 = createMockSocket('socket-3');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Charlie' } as never,
        client3 as never,
      );

      expect(client3.emit).toHaveBeenCalledWith('room-error', {
        message: 'ROOM_FULL',
      });
    });

    it('should emit ALREADY_IN_ROOM if same socket tries to join again', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      gateway.handleJoinRoom(
        { roomId, playerName: 'Alice' } as never,
        client as never,
      );

      expect(client.emit).toHaveBeenCalledWith('room-error', {
        message: 'ALREADY_IN_ROOM',
      });
    });
  });

  describe('leave-room', () => {
    it('should remove the player and emit player-left', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handleLeaveRoom({ roomId } as never, client2 as never);

      expect(client2.leave).toHaveBeenCalledWith(roomId);
      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('player-left', {
        playerName: 'Bob',
        players: ['Alice'],
      });
    });

    it('should destroy room when last player leaves', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      gateway.handleLeaveRoom({ roomId } as never, client as never);

      // Try to join the destroyed room
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );
      expect(client2.emit).toHaveBeenCalledWith('room-error', {
        message: 'ROOM_NOT_FOUND',
      });
    });

    it('should do nothing for non-existent room', () => {
      const client = createMockSocket();
      expect(() =>
        gateway.handleLeaveRoom({ roomId: 'ZZZZZZ' } as never, client as never),
      ).not.toThrow();
    });
  });

  describe('game-event', () => {
    it('should broadcast game event to the room', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handleGameEvent(
        { roomId, event: 'move', payload: { x: 10 } } as never,
        client as never,
      );

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('game-event', {
        event: 'move',
        payload: { x: 10 },
        from: 'Alice',
      });
    });

    it('should ignore events from non-room players', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const outsider = createMockSocket('socket-outsider');

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handleGameEvent(
        { roomId, event: 'move', payload: {} } as never,
        outsider as never,
      );

      expect(server._roomEmit).not.toHaveBeenCalled();
    });

    it('should ignore events for non-existent room', () => {
      const client = createMockSocket();
      expect(() =>
        gateway.handleGameEvent(
          { roomId: 'ZZZZZZ', event: 'move', payload: {} } as never,
          client as never,
        ),
      ).not.toThrow();
    });
  });

  describe('reset-game', () => {
    it('should emit game-reset to all players in the room', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handleResetGame({ roomId } as never, client as never);

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('game-reset', {
        roomId,
        gameType: 'ski',
      });
    });

    it('should ignore reset from non-room player', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const outsider = createMockSocket('socket-outsider');

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handleResetGame({ roomId } as never, outsider as never);

      expect(server._roomEmit).not.toHaveBeenCalled();
    });
  });

  describe('player-ready', () => {
    it('should emit player-ready to the room', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handlePlayerReady({ roomId } as never, client as never);

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('player-ready', {
        playerName: 'Alice',
        readyPlayers: ['Alice'],
      });
    });

    it('should emit game-start when both players are ready', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handlePlayerReady({ roomId } as never, client as never);
      gateway.handlePlayerReady({ roomId } as never, client2 as never);

      expect(server._roomEmit).toHaveBeenCalledWith('game-start');
    });

    it('should not emit game-start if only one player is ready', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handlePlayerReady({ roomId } as never, client as never);

      expect(server._roomEmit).toHaveBeenCalledWith('player-ready', {
        playerName: 'Alice',
        readyPlayers: ['Alice'],
      });
      expect(server._roomEmit).not.toHaveBeenCalledWith('game-start');
    });

    it('should ignore player-ready from non-room player', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const outsider = createMockSocket('socket-outsider');

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handlePlayerReady({ roomId } as never, outsider as never);

      expect(server._roomEmit).not.toHaveBeenCalled();
    });

    it('should clear readyPlayers on reset-game', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      // Alice is ready
      gateway.handlePlayerReady({ roomId } as never, client as never);

      // Reset game
      gateway.handleResetGame({ roomId } as never, client as never);

      // Now both need to ready up again - only Alice readies
      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handlePlayerReady({ roomId } as never, client as never);
      expect(server._roomEmit).not.toHaveBeenCalledWith('game-start');
    });
  });

  describe('room-activity', () => {
    it('should reset the inactivity timer', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      // Advance timer close to timeout
      jest.advanceTimersByTime(55000);

      // Send activity ping
      gateway.handleRoomActivity({ roomId } as never, client as never);

      // Advance another 55 seconds (should NOT trigger timeout since timer was reset)
      jest.advanceTimersByTime(55000);

      // Room should still exist
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );
      expect(client2.emit).not.toHaveBeenCalledWith(
        'room-error',
        expect.anything(),
      );
    });

    it('should ignore activity from non-room player', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const outsider = createMockSocket('socket-outsider');

      expect(() =>
        gateway.handleRoomActivity(
          { roomId } as never,
          outsider as never,
        ),
      ).not.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove disconnected player and notify room', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );

      server.to.mockClear();
      server._roomEmit.mockClear();

      gateway.handleDisconnect(client2 as never);

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('player-left', {
        playerName: 'Bob',
        players: ['Alice'],
      });
    });

    it('should destroy room when last player disconnects', () => {
      const { client, roomId } = createRoom('Alice', 'ski', 'socket-1');

      gateway.handleDisconnect(client as never);

      // Verify room is destroyed
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );
      expect(client2.emit).toHaveBeenCalledWith('room-error', {
        message: 'ROOM_NOT_FOUND',
      });
    });
  });

  describe('inactivity timeout', () => {
    it('should emit room-closed after inactivity timeout', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');

      server.to.mockClear();
      server._roomEmit.mockClear();

      jest.advanceTimersByTime(60000);

      expect(server.to).toHaveBeenCalledWith(roomId);
      expect(server._roomEmit).toHaveBeenCalledWith('room-closed', {
        reason: 'INACTIVITY_TIMEOUT',
      });
    });

    it('should destroy room after inactivity timeout', () => {
      const { roomId } = createRoom('Alice', 'ski', 'socket-1');

      jest.advanceTimersByTime(60000);

      // Room should be destroyed
      const client2 = createMockSocket('socket-2');
      gateway.handleJoinRoom(
        { roomId, playerName: 'Bob' } as never,
        client2 as never,
      );
      expect(client2.emit).toHaveBeenCalledWith('room-error', {
        message: 'ROOM_NOT_FOUND',
      });
    });
  });

  describe('generateRoomId', () => {
    it('should generate IDs with only valid characters (no I, O, 1, 0)', () => {
      for (let i = 0; i < 50; i++) {
        const { roomId } = createRoom('Player', 'ski', `socket-gen-${i}`);
        expect(roomId).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      }
    });
  });
});
