import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { MailService } from '../mail/mail.service.js';

const EMAIL_QUEUE = 'notifications-email';
const BULL_CONNECTION = { url: env.REDIS_URL, maxRetriesPerRequest: null as null };

@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private worker?: Worker;

  constructor(@Inject(MailService) private readonly mail: MailService) {}

  onModuleInit() {
    this.worker = new Worker(
      EMAIL_QUEUE,
      async (job) => {
        const { title, body, userId } = job.data as { userId: string; title: string; body: string };
        await this.mail.sendToUser(userId, title, body);
      },
      { connection: BULL_CONNECTION },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.warn(`Email job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
