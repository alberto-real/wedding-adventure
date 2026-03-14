import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// In production: CORS is handled by reverse proxy (same-origin) or
// configured via CORS_ORIGIN env var for cross-origin deployments (e.g. Vercel + Railway).
// In development: allow any origin so LAN/WiFi testing works.
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigin = process.env.CORS_ORIGIN;

@WebSocketGateway({
  cors: isProduction
    ? (corsOrigin ? { origin: corsOrigin.split(',') } : false)
    : { origin: true },
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
