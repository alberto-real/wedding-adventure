import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';
import { GameRoomGateway } from './game-room/game-room.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AppGateway, GameRoomGateway],
})
export class AppModule {}
