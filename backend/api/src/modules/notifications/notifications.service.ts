import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { env } from '../../config/env.js';
import type { CreateNotificationDto } from './notifications.dto.js';
import { NotificationsPushService } from './notifications-push.service.js';

const EMAIL_QUEUE = 'notifications-email';
const BULL_CONNECTION = { url: env.REDIS_URL, maxRetriesPerRequest: null as null };

@Injectable()
export class NotificationsService {
  private readonly emailQueue: Queue;

  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(NotificationsPushService) private readonly push: NotificationsPushService,
  ) {
    this.emailQueue = new Queue(EMAIL_QUEUE, { connection: BULL_CONNECTION });
  }

  private toApi(row: {
    id: string;
    kind: string;
    title: string;
    body: string | null;
    data: unknown;
    readAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      data: (row.data as Record<string, unknown> | null) ?? null,
      read: row.readAt != null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(userId: string) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((r) => this.toApi(r));
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Уведомление не найдено');
    if (row.userId !== userId) throw new ForbiddenException('Нет доступа');
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: row.readAt ?? new Date() },
    });
    return this.toApi(updated);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async create(userId: string, dto: CreateNotificationDto) {
    const row = await this.prisma.notification.create({
      data: {
        userId,
        kind: dto.kind,
        title: dto.title,
        body: dto.body,
        data: dto.data != null ? (dto.data as Prisma.InputJsonValue) : undefined,
      },
    });

    if (dto.sendEmail) {
      await this.emailQueue.add('send', {
        userId,
        title: dto.title,
        body: dto.body ?? '',
      });
    }

    const apiRow = this.toApi(row);
    this.push.push(userId, apiRow);

    return apiRow;
  }
}
