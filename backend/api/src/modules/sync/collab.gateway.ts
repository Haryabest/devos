import { Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { IncomingMessage } from 'node:http';
import type { Server, WebSocket } from 'ws';
import { CollabService } from './collab.service.js';
import type { SyncMessage } from './sync.types.js';

@WebSocketGateway({ path: '/ws/collab', cors: { origin: true } })
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CollabGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly collab: CollabService) {}

  handleConnection(client: WebSocket, req: IncomingMessage) {
    try {
      const url = new URL(req.url ?? '/ws/collab', 'http://localhost');
      const clientId = url.searchParams.get('clientId')?.trim() || randomUUID();
      const token = url.searchParams.get('token');
      const meta = this.collab.resolveMeta(clientId, token);
      this.collab.register(client, meta);
      client.send(JSON.stringify({ event: 'connected', data: { clientId: meta.clientId } }));
    } catch (err) {
      this.logger.warn(`Connection rejected: ${err}`);
      client.close();
    }
  }

  handleDisconnect(client: WebSocket) {
    this.collab.unregister(client);
  }

  @SubscribeMessage('sync')
  handleSync(@ConnectedSocket() client: WebSocket, @MessageBody() data: SyncMessage) {
    if (!data?.clientId || !data?.store) return;
    this.collab.broadcastSync(client, data);
  }

  @SubscribeMessage('sync-request')
  handleSyncRequest(@ConnectedSocket() client: WebSocket) {
    this.collab.requestSync(client);
  }
}
