import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { RoadmapController } from './roadmap.controller.js';
import { RoadmapService } from './roadmap.service.js';

@Module({
  imports: [AuthModule],
  controllers: [RoadmapController],
  providers: [RoadmapService],
  exports: [RoadmapService],
})
export class RoadmapModule {}
