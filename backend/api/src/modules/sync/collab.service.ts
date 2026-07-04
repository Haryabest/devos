import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { WebSocket } from 'ws';
import { env } from '../../config/env.js';
import type { CollabRedisMessage } from '../ws-bridge/ws-redis-bridge.service.js';
import { WsRedisBridgeService } from '../ws-bridge/ws-redis-bridge.service.js';
import type {
  CollabClientMeta,
  CollabHostLeft,
  CollabRoomJoin,
  CollabRoomRole,
  SyncMessage,
} from './sync.types.js';

interface RoomEntry {
  client: WebSocket;
  clientId: string;
  userId: string | null;
  role: CollabRoomRole;
}

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name);
  private readonly clients = new Map<WebSocket, CollabClientMeta>();
  private readonly rooms = new Map<string, RoomEntry[]>();

  constructor(
    private readonly jwt: JwtService,
    private readonly wsBridge: WsRedisBridgeService,
  ) {}

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

    for (const [projectId, entries] of this.rooms) {
      for (const entry of entries) {
        if (entry.client !== client || entry.role !== 'host') continue;
        this.notifyHostLeft(projectId, { projectId, userId: entry.userId }, client);
      }
    }

    for (const [projectId, entries] of this.rooms) {
      const next = entries.filter((entry) => entry.client !== client);
      if (next.length === 0) this.rooms.delete(projectId);
      else this.rooms.set(projectId, next);
    }

    this.clients.delete(client);
  }

  joinRoom(client: WebSocket, input: CollabRoomJoin) {
    const meta = this.clients.get(client);
    if (!meta) return;

    this.leaveRoom(client, input.projectId);

    const entries = this.rooms.get(input.projectId) ?? [];
    entries.push({
      client,
      clientId: meta.clientId,
      userId: meta.userId,
      role: input.role,
    });
    this.rooms.set(input.projectId, entries);
  }

  leaveRoom(client: WebSocket, projectId: string) {
    const entries = this.rooms.get(projectId);
    if (!entries) return;
    const next = entries.filter((entry) => entry.client !== client);
    if (next.length === 0) this.rooms.delete(projectId);
    else this.rooms.set(projectId, next);
  }

  private notifyHostLeft(projectId: string, data: CollabHostLeft, exclude: WebSocket) {
    const envelope = JSON.stringify({ event: 'host-left', data });
    this.deliverCollabLocally({
      envelope,
      projectId,
      excludeClientId: this.clients.get(exclude)?.clientId,
    });
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
    const excludeClientId = this.clients.get(from)?.clientId;
    this.deliverCollabLocally({ envelope, excludeClientId });
    this.wsBridge.publishCollab({ envelope, excludeClientId });
  }

  requestSync(from: WebSocket) {
    const envelope = JSON.stringify({ event: 'sync-request', data: {} });
    const excludeClientId = this.clients.get(from)?.clientId;
    this.deliverCollabLocally({ envelope, excludeClientId });
    this.wsBridge.publishCollab({ envelope, excludeClientId });
  }

  broadcastPresence(from: WebSocket, data: Record<string, unknown>) {
    const meta = this.clients.get(from);
    if (!meta) return;
    const envelope = JSON.stringify({
      event: 'presence',
      data: { ...data, clientId: meta.clientId, userId: meta.userId },
    });
    const projectId = data.projectId as string | undefined;
    this.deliverCollabLocally({
      envelope,
      excludeClientId: meta.clientId,
      projectId,
    });
    this.wsBridge.publishCollab({
      envelope,
      excludeClientId: meta.clientId,
      projectId,
    });
  }

  broadcastRaw(from: WebSocket, event: string, data: Record<string, unknown>) {
    const meta = this.clients.get(from);
    if (!meta) return;
    const envelope = JSON.stringify({ event, data: { ...data, from: meta.clientId } });
    const roomKey = (data.projectId ?? data.roomId) as string | undefined;
    this.deliverCollabLocally({
      envelope,
      excludeClientId: meta.clientId,
      roomKey,
    });
    this.wsBridge.publishCollab({
      envelope,
      excludeClientId: meta.clientId,
      roomKey,
    });
  }

  deliverFromRedis(message: CollabRedisMessage) {
    this.deliverCollabLocally(message);
  }

  private deliverCollabLocally(message: CollabRedisMessage) {
    const { envelope, excludeClientId, projectId, roomKey } = message;
    for (const [peer, peerMeta] of this.clients) {
      if (peer.readyState !== peer.OPEN) continue;
      if (excludeClientId && peerMeta.clientId === excludeClientId) continue;

      if (projectId) {
        const inRoom = (this.rooms.get(projectId) ?? []).some((e) => e.client === peer);
        if (!inRoom) continue;
      }

      if (roomKey) {
        const inRoom = (this.rooms.get(roomKey) ?? []).some((e) => e.client === peer);
        if (!inRoom) continue;
      }

      peer.send(envelope);
    }
  }

  getConnectionCount(): number {
    return this.clients.size;
  }
}
