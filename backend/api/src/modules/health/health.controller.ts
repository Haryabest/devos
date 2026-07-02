import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import type { HealthResponse } from '@devos/shared';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();
  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const dbUp = await this.prisma
      .$queryRawUnsafe('SELECT 1')
      .then(() => true)
      .catch(() => false);

    return {
      status: dbUp ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: Math.round((Date.now() - this.startedAt) / 1000),
      services: {
        db: dbUp ? 'up' : 'down',
        // Redis check will be wired when @devos/api/modules/queues is added.
        redis: 'up',
      },
    };
  }
}
