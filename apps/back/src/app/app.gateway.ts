import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// In production: CORS is not needed because Nginx reverse proxy
// ensures everything is same-origin.
// In development: Angular dev server runs on port 4200, NestJS on 3000,
// so we need CORS for localhost only.
const isProduction = process.env.NODE_ENV === 'production';

@WebSocketGateway({
  cors: isProduction
    ? false
    : { origin: ['http://localhost:4200', 'http://localhost:4300'] },
})
export class AppGateway {
  @WebSocketServer() server!: Server;

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    console.log(`Message received from client ${client.id}: ${data}`);
    this.server.emit('message', `Server received: ${data}`); // Echo message to all connected clients
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
