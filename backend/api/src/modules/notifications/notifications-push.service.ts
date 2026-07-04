import { Injectable, Logger } from '@nestjs/common';
import type { WebSocket } from 'ws';
import { WsRedisBridgeService } from '../ws-bridge/ws-redis-bridge.service.js';

@Injectable()
export class NotificationsPushService {
  private readonly logger = new Logger(NotificationsPushService.name);
  private readonly sockets = new Map<string, Set<WebSocket>>();

  constructor(private readonly wsBridge: WsRedisBridgeService) {}

  register(userId: string, client: WebSocket) {
    const set = this.sockets.get(userId) ?? new Set<WebSocket>();
    set.add(client);
    this.sockets.set(userId, set);
    this.logger.debug(`WS subscribed user=${userId.slice(0, 8)}`);
  }

  unregister(userId: string, client: WebSocket) {
    const set = this.sockets.get(userId);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) this.sockets.delete(userId);
  }

  deliverLocal(userId: string, envelope: string) {
    const set = this.sockets.get(userId);
    if (!set?.size) return;
    for (const client of set) {
      if (client.readyState === client.OPEN) client.send(envelope);
    }
  }

  push(userId: string, payload: unknown) {
    const envelope = JSON.stringify({ event: 'notification', data: payload });
    this.deliverLocal(userId, envelope);
    this.wsBridge.publishNotification(userId, envelope);
  }
}
