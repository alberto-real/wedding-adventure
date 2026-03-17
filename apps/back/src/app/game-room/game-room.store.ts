import { Injectable } from '@nestjs/common';

export interface Player {
  socketId: string;
  name: string;
}

export interface GameRoom {
  id: string;
  gameType: string;
  players: Player[];
  readyPlayers: Set<string>;
  inactivityTimer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

export interface RoomSummary {
  id: string;
  gameType: string;
  players: string[];
  playerCount: number;
  createdAt: number;
  age: number;
}

@Injectable()
export class GameRoomStore {
  private rooms = new Map<string, GameRoom>();

  get(id: string): GameRoom | undefined {
    return this.rooms.get(id);
  }

  set(id: string, room: GameRoom): void {
    this.rooms.set(id, room);
  }

  has(id: string): boolean {
    return this.rooms.has(id);
  }

  delete(id: string): boolean {
    return this.rooms.delete(id);
  }

  values(): IterableIterator<GameRoom> {
    return this.rooms.values();
  }

  entries(): IterableIterator<[string, GameRoom]> {
    return this.rooms.entries();
  }

  get size(): number {
    return this.rooms.size;
  }

  listRooms(): RoomSummary[] {
    const now = Date.now();
    return Array.from(this.rooms.values()).map((room) => ({
      id: room.id,
      gameType: room.gameType,
      players: room.players.map((p) => p.name),
      playerCount: room.players.length,
      createdAt: room.createdAt,
      age: Math.round((now - room.createdAt) / 1000),
    }));
  }

  waitingCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      if (room.players.length === 1) count++;
    }
    return count;
  }
}
