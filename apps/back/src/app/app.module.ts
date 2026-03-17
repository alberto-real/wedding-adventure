import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';
import { GameRoomStore } from './game-room/game-room.store';
import { GameRoomGateway } from './game-room/game-room.gateway';
import { AdminController } from './game-room/admin.controller';

@Module({
  imports: [],
  controllers: [AppController, AdminController],
  providers: [AppService, AppGateway, GameRoomStore, GameRoomGateway],
})
export class AppModule {}
