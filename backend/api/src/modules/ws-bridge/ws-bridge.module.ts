import { Global, Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SyncModule } from '../sync/sync.module.js';
import { WsBridgeBootstrap } from './ws-bridge.bootstrap.js';
import { WsRedisBridgeService } from './ws-redis-bridge.service.js';

@Global()
@Module({
  imports: [NotificationsModule, SyncModule],
  providers: [WsRedisBridgeService, WsBridgeBootstrap],
  exports: [WsRedisBridgeService],
})
export class WsBridgeModule {}
