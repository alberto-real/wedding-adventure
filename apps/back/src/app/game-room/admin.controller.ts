import { Controller, Get, Delete, Param } from '@nestjs/common';
import { GameRoomStore } from './game-room.store';
import { GameRoomGateway } from './game-room.gateway';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly store: GameRoomStore,
    private readonly gateway: GameRoomGateway,
  ) {}

  @Get('rooms')
  listRooms() {
    return {
      rooms: this.store.listRooms(),
      total: this.store.size,
      waitingCount: this.store.waitingCount(),
    };
  }

  @Get('rooms/waiting-count')
  waitingCount() {
    return { waitingCount: this.store.waitingCount() };
  }

  @Delete('rooms/:id')
  closeRoom(@Param('id') id: string) {
    const closed = this.gateway.forceCloseRoom(id);
    return { closed, roomId: id };
  }
}
