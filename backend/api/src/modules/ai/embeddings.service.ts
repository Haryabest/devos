import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, EmbeddingSource } from '@prisma/client';
import OpenAI from 'openai';
import { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';

const CHUNK_SIZE = 1500;
const QUEUE_NAME = 'embeddings-index';
const BULL_CONNECTION = { url: env.REDIS_URL, maxRetriesPerRequest: null as null };

export interface EmbeddingJobData {
  workspaceId: string;
  projectId?: string | null;
  source: EmbeddingSource;
  sourceId: string;
  content: string;
}

@Injectable()
export class EmbeddingsService implements OnModuleDestroy {
  private openai: OpenAI | null = null;
  readonly queue: Queue;

  constructor(@Inject(PrismaClient) private readonly prisma: PrismaClient) {
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
    this.queue = new Queue(QUEUE_NAME, { connection: BULL_CONNECTION });
  }

  async onModuleDestroy() {
    await this.queue.close();
  }

  async enqueueIndex(data: EmbeddingJobData) {
    await this.queue.add('index', data, { removeOnComplete: 100, removeOnFail: 50 });
  }

  async indexWorkspace(workspaceId: string) {
    const docs = await this.prisma.document.findMany({
      where: { workspaceId },
      select: { id: true, projectId: true, title: true, contentMd: true },
    });
    for (const doc of docs) {
      await this.enqueueIndex({
        workspaceId,
        projectId: doc.projectId,
        source: 'DOCUMENT',
        sourceId: doc.id,
        content: `${doc.title}\n${doc.contentMd}`,
      });
    }

    const tasks = await this.prisma.task.findMany({
      where: { project: { workspaceId } },
      select: { id: true, projectId: true, title: true, description: true },
    });
    for (const task of tasks) {
      await this.enqueueIndex({
        workspaceId,
        projectId: task.projectId,
        source: 'TASK',
        sourceId: task.id,
        content: `${task.title}\n${task.description ?? ''}`,
      });
    }

    return { queued: docs.length + tasks.length };
  }

  async indexContent(data: EmbeddingJobData) {
    if (!this.openai || !data.content.trim()) return;

    const chunks = this.chunk(data.content);
    await this.prisma.embedding.deleteMany({
      where: { source: data.source, sourceId: data.sourceId },
    });

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i]!;
      const vector = await this.embed(content);
      await this.insertEmbedding({ ...data, chunkIndex: i, content, vector });
    }
  }

  async searchSimilar(
    workspaceId: string,
    query: string,
    projectId?: string,
    limit = 5,
  ): Promise<string[]> {
    if (!this.openai || !query.trim()) return [];
    const vector = await this.embed(query);
    const vectorStr = `[${vector.join(',')}]`;

    const rows = projectId
      ? await this.prisma.$queryRaw<{ content: string }[]>`
          SELECT content FROM "Embedding"
          WHERE "workspaceId" = ${workspaceId}
            AND ("projectId" = ${projectId} OR "projectId" IS NULL)
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT ${limit}
        `
      : await this.prisma.$queryRaw<{ content: string }[]>`
          SELECT content FROM "Embedding"
          WHERE "workspaceId" = ${workspaceId}
          ORDER BY embedding <=> ${vectorStr}::vector
          LIMIT ${limit}
        `;

    return rows.map((r) => r.content);
  }

  private chunk(text: string): string[] {
    if (text.length <= CHUNK_SIZE) return [text];
    const parts: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      parts.push(text.slice(i, i + CHUNK_SIZE));
    }
    return parts;
  }

  private async embed(text: string): Promise<number[]> {
    const res = await this.openai!.embeddings.create({
      model: env.OPENAI_EMBED_MODEL,
      input: text,
    });
    return res.data[0]!.embedding;
  }

  private async insertEmbedding(input: {
    workspaceId: string;
    projectId?: string | null;
    source: EmbeddingSource;
    sourceId: string;
    chunkIndex: number;
    content: string;
    vector: number[];
  }) {
    const vectorStr = `[${input.vector.join(',')}]`;
    const id = randomUUID();
    await this.prisma.$executeRaw`
      INSERT INTO "Embedding" (id, "workspaceId", "projectId", source, "sourceId", "chunkIndex", content, embedding, "createdAt")
      VALUES (
        ${id},
        ${input.workspaceId},
        ${input.projectId ?? null},
        ${input.source}::"EmbeddingSource",
        ${input.sourceId},
        ${input.chunkIndex},
        ${input.content},
        ${vectorStr}::vector,
        NOW()
      )
    `;
  }
}
