import { Injectable, Inject, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { env } from '../../config/env.js';
import { EmbeddingsService, type EmbeddingJobData } from './embeddings.service.js';

const QUEUE_NAME = 'embeddings-index';
const BULL_CONNECTION = { url: env.REDIS_URL, maxRetriesPerRequest: null as null };

@Injectable()
export class EmbeddingsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingsProcessor.name);
  private worker?: Worker;

  constructor(@Inject(EmbeddingsService) private readonly embeddings: EmbeddingsService) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        await this.embeddings.indexContent(job.data as EmbeddingJobData);
      },
      { connection: BULL_CONNECTION, concurrency: 2 },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.warn(`Embedding job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
