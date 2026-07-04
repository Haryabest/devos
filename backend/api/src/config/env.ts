import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

/** Пакет @devos/api — env.ts лежит в src/config/. */
const API_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const ENV_CANDIDATES = [
  resolve(API_ROOT, '.env'),
  resolve(API_ROOT, '.env.local'),
  resolve(API_ROOT, '../.env'),
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'api/.env'),
  resolve(process.cwd(), '../.env'),
];

for (const path of ENV_CANDIDATES) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true });
  }
}

/**
 * Единая точка типизированных env-переменных.
 * Валидируется при импорте — плохие переменные роняют процесс сразу, не в середине запроса.
 */

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  CORS_ORIGIN: z
    .string()
    .default('http://localhost:1420,http://127.0.0.1:1420,http://localhost:5173,http://127.0.0.1:5173')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  AI_PROVIDER: z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'LOCAL']).default('OPENAI'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_EMBED_MODEL: z.string().default('text-embedding-3-small'),

  STORAGE_DRIVER: z.enum(['LOCAL', 'S3', 'MINIO', 'R2', 'B2']).default('LOCAL'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional(),
  FIGMA_CLIENT_ID: z.string().optional(),
  FIGMA_CLIENT_SECRET: z.string().optional(),

  /** Rate limit: max requests per TTL window (global). */
  RATE_LIMIT_TTL_MS: z.coerce.number().int().min(1000).default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),

  /** Observability */
  SENTRY_DSN: z.string().url().optional(),

  /** SMTP — если не задан, email логируется в stdout worker'а */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  // eslint-disable-next-line no-console
  console.error(
    `💡 Создайте backend/api/.env (пример: backend/api/.env.example). Искали: ${ENV_CANDIDATES.join(', ')}`,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof schema>;
