import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module.js';

export interface CollabRedisMessage {
  envelope: string;
  excludeClientId?: string;
  projectId?: string;
  roomKey?: string;
}

const NOTIFICATIONS_CHANNEL = 'devos:ws:notifications';
const COLLAB_CHANNEL = 'devos:ws:collab';

@Injectable()
export class WsRedisBridgeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WsRedisBridgeService.name);
  readonly instanceId = randomUUID();
  private sub!: Redis;
  private pub!: Redis;
  private onNotification?: (userId: string, envelope: string) => void;
  private onCollab?: (message: CollabRedisMessage) => void;

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  registerHandlers(handlers: {
    onNotification: (userId: string, envelope: string) => void;
    onCollab: (message: CollabRedisMessage) => void;
  }) {
    this.onNotification = handlers.onNotification;
    this.onCollab = handlers.onCollab;
  }

  async onModuleInit() {
    this.sub = this.redis.duplicate();
    this.pub = this.redis.duplicate();
    await Promise.all([this.sub.connect(), this.pub.connect()]);
    await this.sub.subscribe(NOTIFICATIONS_CHANNEL, COLLAB_CHANNEL);
    this.sub.on('message', (channel, raw) => {
      try {
        const msg = JSON.parse(raw) as { origin?: string };
        if (msg.origin === this.instanceId) return;

        if (channel === NOTIFICATIONS_CHANNEL) {
          const { userId, envelope } = msg as { userId: string; envelope: string };
          this.onNotification?.(userId, envelope);
          return;
        }

        const { envelope, excludeClientId, projectId, roomKey } = msg as CollabRedisMessage;
        this.onCollab?.({ envelope, excludeClientId, projectId, roomKey });
      } catch (err) {
        this.logger.warn(`WS Redis message parse failed: ${err}`);
      }
    });
    this.logger.log(`WS Redis bridge ready (instance=${this.instanceId.slice(0, 8)})`);
  }

  async onModuleDestroy() {
    await Promise.all([
      this.sub?.quit().catch(() => undefined),
      this.pub?.quit().catch(() => undefined),
    ]);
  }

  publishNotification(userId: string, envelope: string) {
    void this.pub.publish(
      NOTIFICATIONS_CHANNEL,
      JSON.stringify({ origin: this.instanceId, userId, envelope }),
    );
  }

  publishCollab(message: CollabRedisMessage) {
    void this.pub.publish(COLLAB_CHANNEL, JSON.stringify({ origin: this.instanceId, ...message }));
  }
}
