import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { WebSocket } from 'ws';
import { env } from '../../config/env.js';
import type { CollabClientMeta, SyncMessage } from './sync.types.js';

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name);
  private readonly clients = new Map<WebSocket, CollabClientMeta>();

  constructor(private readonly jwt: JwtService) {}

  register(client: WebSocket, meta: CollabClientMeta) {
    this.clients.set(client, meta);
    this.logger.debug(
      `Client connected: ${meta.clientId.slice(0, 8)} user=${meta.userId ?? 'anon'}`,
    );
  }

  unregister(client: WebSocket) {
    const meta = this.clients.get(client);
    if (meta) {
      this.logger.debug(`Client disconnected: ${meta.clientId.slice(0, 8)}`);
    }
    this.clients.delete(client);
  }

  resolveMeta(clientId: string, token?: string | null): CollabClientMeta {
    if (!token) {
      return { clientId, userId: null, userName: null };
    }
    try {
      const payload = this.jwt.verify<{ sub: string; name?: string }>(token, {
        secret: env.JWT_ACCESS_SECRET,
      });
      return {
        clientId,
        userId: payload.sub,
        userName: payload.name ?? null,
      };
    } catch {
      return { clientId, userId: null, userName: null };
    }
  }

  broadcastSync(from: WebSocket, message: SyncMessage) {
    const envelope = JSON.stringify({ event: 'sync', data: message });
    for (const [peer, meta] of this.clients) {
      if (peer === from || peer.readyState !== peer.OPEN) continue;
      if (meta.clientId === message.clientId) continue;
      peer.send(envelope);
    }
  }

  requestSync(from: WebSocket) {
    const envelope = JSON.stringify({ event: 'sync-request', data: {} });
    for (const [peer] of this.clients) {
      if (peer === from || peer.readyState !== peer.OPEN) continue;
      peer.send(envelope);
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }
}
