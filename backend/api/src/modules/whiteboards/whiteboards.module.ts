import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { WhiteboardsController } from './whiteboards.controller.js';
import { WhiteboardsService } from './whiteboards.service.js';

@Module({
  imports: [AuthModule],
  controllers: [WhiteboardsController],
  providers: [WhiteboardsService],
  exports: [WhiteboardsService],
})
export class WhiteboardsModule {}
