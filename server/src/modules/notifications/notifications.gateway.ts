import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*', // Customize this based on env in proper implementation
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track connected users: userId -> Set of socketIds
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsService)) // Inject service if needed later, right now not strict
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`[Socket] New connection attempt: ${client.id}`);
    try {
      const authHeader = client.handshake.headers.authorization;
      const token = authHeader?.split(' ')[1] || client.handshake.auth?.token;
      
      if (!token) {
        console.log(`[Socket] No token provided, disconnecting: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = String(payload.sub);
      console.log(`[Socket] Auth successful for user ID: ${userId}`);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      client.data.userId = userId;

      // Join a distinct room for the user to easily broadcast
      client.join(`user_${userId}`);
      console.log(`[Socket] Client ${client.id} joined room user_${userId}`);
    } catch (error) {
      console.error(`[Socket] Verification/Connection error:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      sockets?.delete(client.id);
      if (sockets?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  sendNotificationToUser(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('notification', payload);
  }
}
