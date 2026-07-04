import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CollabService } from '../sync/collab.service.js';
import { NotificationsPushService } from '../notifications/notifications-push.service.js';
import { WsRedisBridgeService } from './ws-redis-bridge.service.js';

@Injectable()
export class WsBridgeBootstrap implements OnModuleInit {
  constructor(
    @Inject(WsRedisBridgeService) private readonly bridge: WsRedisBridgeService,
    @Inject(NotificationsPushService) private readonly push: NotificationsPushService,
    @Inject(CollabService) private readonly collab: CollabService,
  ) {}

  onModuleInit() {
    this.bridge.registerHandlers({
      onNotification: (userId, envelope) => this.push.deliverLocal(userId, envelope),
      onCollab: (message) => this.collab.deliverFromRedis(message),
    });
  }
}
