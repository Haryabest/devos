import { describe, expect, it } from 'vitest';
import { createTestApp } from '../test/test-app.js';

describe('API e2e smoke', () => {
  it('GET /health returns status payload', async () => {
    const app = await createTestApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { status: string };
    expect(['ok', 'degraded']).toContain(body.status);
    await app.close();
  });

  it('GET /metrics returns prometheus text', async () => {
    const app = await createTestApp();
    const res = await app.inject({ method: 'GET', url: '/metrics' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.body).toContain('devos_');
    await app.close();
  });

  it('POST /api/auth/login rejects unknown credentials', async () => {
    const app = await createTestApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'missing@devos.local', password: 'wrong-password-123' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
