import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.spec.ts',
      'src/**/*.integration.spec.ts',
      'src/**/*.e2e.spec.ts',
      'src/**/*.load.spec.ts',
    ],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://devos:devos@localhost:54329/devos',
      REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6380',
      JWT_ACCESS_SECRET: 'test-access-secret-min16',
      JWT_REFRESH_SECRET: 'test-refresh-secret-min16',
      GITHUB_WEBHOOK_SECRET: 'test-webhook-secret-min16',
    },
  },
});
