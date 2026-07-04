import { Controller, Get, Patch, Post, Param, Req, Inject } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { NotificationsService } from './notifications.service.js';
import { JwtGuard } from '../auth/jwt.guard.js';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService) private readonly svc: NotificationsService,
    @Inject(JwtGuard) private readonly guard: JwtGuard,
  ) {}

  private async uid(req: FastifyRequest & { userId?: string }) {
    return this.guard.authenticate(req as Parameters<typeof this.guard.authenticate>[0]);
  }

  @Get()
  async list(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.list(userId);
  }

  @Get('unread-count')
  async unreadCount(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.unreadCount(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.markRead(id, userId);
  }

  @Post('read-all')
  async markAllRead(@Req() req: FastifyRequest & { userId?: string }) {
    const userId = await this.uid(req);
    return this.svc.markAllRead(userId);
  }
}
