import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CollabGateway } from './collab.gateway.js';
import { CollabService } from './collab.service.js';

@Module({
  imports: [AuthModule],
  providers: [CollabService, CollabGateway],
  exports: [CollabService],
})
export class SyncModule {}
