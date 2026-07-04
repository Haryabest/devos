import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { IncomingMessage } from 'node:http';
import type { Server, WebSocket } from 'ws';
import { env } from '../../config/env.js';
import { NotificationsPushService } from './notifications-push.service.js';

@WebSocketGateway({ path: '/ws/notifications', cors: { origin: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly clientUsers = new WeakMap<WebSocket, string>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly push: NotificationsPushService,
  ) {}

  handleConnection(client: WebSocket, req: IncomingMessage) {
    try {
      const url = new URL(req.url ?? '/ws/notifications', 'http://localhost');
      const token = url.searchParams.get('token');
      if (!token) {
        client.close();
        return;
      }
      const payload = this.jwt.verify<{ sub: string }>(token, { secret: env.JWT_ACCESS_SECRET });
      this.clientUsers.set(client, payload.sub);
      this.push.register(payload.sub, client);
      client.send(JSON.stringify({ event: 'connected', data: { ok: true } }));
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err}`);
      client.close();
    }
  }

  handleDisconnect(client: WebSocket) {
    const userId = this.clientUsers.get(client);
    if (userId) this.push.unregister(userId, client);
    this.clientUsers.delete(client);
  }
}
