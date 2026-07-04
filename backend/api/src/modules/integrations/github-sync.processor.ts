import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { env } from '../../config/env.js';

const GITHUB_SYNC_QUEUE = 'github-sync';
const BULL_CONNECTION = { url: env.REDIS_URL, maxRetriesPerRequest: null as null };

export interface GithubSyncJob {
  workspaceId: string;
  integrationId: string;
  event: string;
  repoFullName: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class GithubSyncProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GithubSyncProcessor.name);
  private worker?: Worker;

  onModuleInit() {
    this.worker = new Worker(
      GITHUB_SYNC_QUEUE,
      async (job) => {
        const data = job.data as GithubSyncJob;
        this.logger.log(
          `GitHub ${data.event} on ${data.repoFullName} (workspace=${data.workspaceId.slice(0, 8)})`,
        );
      },
      { connection: BULL_CONNECTION },
    );
    this.worker.on('failed', (job, err) => {
      this.logger.warn(`GitHub sync job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}

export { GITHUB_SYNC_QUEUE };
