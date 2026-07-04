import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsPushService } from './notifications-push.service.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsPushService, NotificationsGateway],
  exports: [NotificationsService, NotificationsPushService],
})
export class NotificationsModule {}
