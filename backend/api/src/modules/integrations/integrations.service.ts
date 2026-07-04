import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Prisma, PrismaClient, IntegrationProvider } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { env } from '../../config/env.js';
import { REDIS_CLIENT } from '../redis/redis.module.js';
import { GITHUB_SYNC_QUEUE, type GithubSyncJob } from './github-sync.processor.js';
import { verifyGithubWebhookSignature } from '../../lib/github-webhook.js';

const OAUTH_STATE_TTL_SEC = 600;
const PROVIDERS = ['GITHUB', 'GITLAB', 'FIGMA'] as const;
type ProviderKey = (typeof PROVIDERS)[number];

interface OAuthState {
  workspaceId: string;
  userId: string;
  provider: IntegrationProvider;
}

@Injectable()
export class IntegrationsService {
  private readonly githubSyncQueue: Queue;

  constructor(
    @Inject(PrismaClient) private readonly prisma: PrismaClient,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.githubSyncQueue = new Queue(GITHUB_SYNC_QUEUE, {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    });
  }

  private apiBase() {
    const host = env.HOST === '0.0.0.0' ? 'localhost' : env.HOST;
    return `http://${host}:${env.PORT}/api`;
  }

  private parseProvider(raw: string): IntegrationProvider {
    const key = raw.toUpperCase() as ProviderKey;
    if (!PROVIDERS.includes(key)) throw new BadRequestException('Неизвестный провайдер');
    return key as IntegrationProvider;
  }

  private async assertMember(workspaceId: string, userId: string) {
    const m = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!m) throw new ForbiddenException('Нет доступа к воркспейсу');
    return m;
  }

  private toApi(row: {
    id: string;
    provider: IntegrationProvider;
    externalId: string | null;
    scopes: string[];
    accessToken: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      provider: row.provider,
      externalId: row.externalId,
      scopes: row.scopes,
      connected: Boolean(row.accessToken),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const rows = await this.prisma.integration.findMany({
      where: { workspaceId },
      orderBy: { provider: 'asc' },
    });
    return rows.map((r) => this.toApi(r));
  }

  async getAuthUrl(providerRaw: string, workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const provider = this.parseProvider(providerRaw);
    const state = randomBytes(24).toString('hex');
    await this.redis.set(
      `oauth:state:${state}`,
      JSON.stringify({ workspaceId, userId, provider } satisfies OAuthState),
      'EX',
      OAUTH_STATE_TTL_SEC,
    );

    const redirectUri = `${this.apiBase()}/integrations/${provider.toLowerCase()}/callback`;
    const url = this.buildAuthorizeUrl(provider, redirectUri, state);
    if (!url) throw new BadRequestException('OAuth не настроен для провайдера');
    return { url };
  }

  private buildAuthorizeUrl(provider: IntegrationProvider, redirectUri: string, state: string) {
    if (provider === 'GITHUB') {
      if (!env.GITHUB_CLIENT_ID) return null;
      const p = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'repo read:user',
        state,
      });
      return `https://github.com/login/oauth/authorize?${p}`;
    }
    if (provider === 'GITLAB') {
      if (!env.GITLAB_CLIENT_ID) return null;
      const p = new URLSearchParams({
        client_id: env.GITLAB_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'api read_user',
        state,
      });
      return `https://gitlab.com/oauth/authorize?${p}`;
    }
    if (provider === 'FIGMA') {
      if (!env.FIGMA_CLIENT_ID) return null;
      const p = new URLSearchParams({
        client_id: env.FIGMA_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'files:read',
        state,
        response_type: 'code',
      });
      return `https://www.figma.com/oauth?${p}`;
    }
    return null;
  }

  async handleCallback(providerRaw: string, code: string, state: string) {
    const provider = this.parseProvider(providerRaw);
    const raw = await this.redis.get(`oauth:state:${state}`);
    if (!raw) throw new BadRequestException('Недействительный state');
    await this.redis.del(`oauth:state:${state}`);
    const parsed = JSON.parse(raw) as OAuthState;
    if (parsed.provider !== provider) throw new BadRequestException('Неверный провайдер');

    const redirectUri = `${this.apiBase()}/integrations/${provider.toLowerCase()}/callback`;
    const tokens = await this.exchangeCode(provider, code, redirectUri);
    if (!tokens) throw new BadRequestException('Не удалось получить токен');

    await this.prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId: parsed.workspaceId, provider } },
      create: {
        workspaceId: parsed.workspaceId,
        provider,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scopes: tokens.scopes,
        externalId: tokens.externalId,
        connectedById: parsed.userId,
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        scopes: tokens.scopes,
        externalId: tokens.externalId,
        connectedById: parsed.userId,
      },
    });

    return { ok: true, workspaceId: parsed.workspaceId, provider };
  }

  private async exchangeCode(
    provider: IntegrationProvider,
    code: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    scopes: string[];
    externalId?: string;
  } | null> {
    if (provider === 'GITHUB') {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return null;
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string; scope?: string; error?: string };
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        scopes: data.scope?.split(',') ?? [],
      };
    }

    if (provider === 'GITLAB') {
      if (!env.GITLAB_CLIENT_ID || !env.GITLAB_CLIENT_SECRET) return null;
      const body = new URLSearchParams({
        client_id: env.GITLAB_CLIENT_ID,
        client_secret: env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
      const res = await fetch('https://gitlab.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        scope?: string;
      };
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scopes: data.scope?.split(' ') ?? [],
      };
    }

    if (provider === 'FIGMA') {
      if (!env.FIGMA_CLIENT_ID || !env.FIGMA_CLIENT_SECRET) return null;
      const body = new URLSearchParams({
        client_id: env.FIGMA_CLIENT_ID,
        client_secret: env.FIGMA_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      });
      const res = await fetch('https://api.figma.com/v1/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        access_token?: string;
        refresh_token?: string;
        user_id?: string;
      };
      if (!data.access_token) return null;
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        scopes: ['files:read'],
        externalId: data.user_id,
      };
    }

    return null;
  }

  async connectManual(providerRaw: string, workspaceId: string, userId: string, token: string, externalId?: string) {
    await this.assertMember(workspaceId, userId);
    const provider = this.parseProvider(providerRaw);
    const row = await this.prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId, provider } },
      create: {
        workspaceId,
        provider,
        accessToken: token,
        externalId,
        connectedById: userId,
      },
      update: {
        accessToken: token,
        externalId,
        connectedById: userId,
      },
    });
    return this.toApi(row);
  }

  async disconnect(providerRaw: string, workspaceId: string, userId: string) {
    await this.assertMember(workspaceId, userId);
    const provider = this.parseProvider(providerRaw);
    const row = await this.prisma.integration.findUnique({
      where: { workspaceId_provider: { workspaceId, provider } },
    });
    if (!row) throw new NotFoundException('Интеграция не найдена');
    await this.prisma.integration.delete({ where: { id: row.id } });
  }

  verifyGithubSignature(payload: string, signature?: string) {
    return verifyGithubWebhookSignature(payload, signature, env.GITHUB_WEBHOOK_SECRET);
  }

  async handleGithubWebhook(
    rawBody: string,
    signature: string | undefined,
    body: Record<string, unknown>,
  ) {
    if (!this.verifyGithubSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid GitHub webhook signature');
    }

    const event = String(body._event ?? 'unknown');
    const repo = body.repository as { full_name?: string } | undefined;
    const repoFullName = repo?.full_name;
    if (!repoFullName) return { ok: true, skipped: true };

    const integrations = await this.prisma.integration.findMany({
      where: { provider: 'GITHUB' },
    });

    for (const integration of integrations) {
      const metadata = (integration.metadata as Record<string, unknown> | null) ?? {};
      const trackedRepo = metadata.repoFullName as string | undefined;
      if (trackedRepo && trackedRepo !== repoFullName) continue;

      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          metadata: {
            ...metadata,
            repoFullName,
            lastEvent: event,
            lastPushAt: new Date().toISOString(),
            lastPayload: { ref: body.ref, pusher: body.pusher },
          } as Prisma.InputJsonValue,
        },
      });

      const job: GithubSyncJob = {
        workspaceId: integration.workspaceId,
        integrationId: integration.id,
        event,
        repoFullName,
        payload: body,
      };
      await this.githubSyncQueue.add('sync', job, { removeOnComplete: 50, removeOnFail: 20 });
    }

    return { ok: true, repo: repoFullName, event };
  }
}
