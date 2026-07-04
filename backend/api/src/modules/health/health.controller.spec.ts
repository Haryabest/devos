import { describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns ok when db and redis are up', async () => {
    const prisma = { $queryRawUnsafe: vi.fn().mockResolvedValue(1) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    const controller = new HealthController(prisma as never, redis as never);
    const result = await controller.check();
    expect(result.status).toBe('ok');
  });

  it('returns degraded when db is down', async () => {
    const prisma = { $queryRawUnsafe: vi.fn().mockRejectedValue(new Error('down')) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    const controller = new HealthController(prisma as never, redis as never);
    const result = await controller.check();
    expect(result.status).toBe('degraded');
  });
});
