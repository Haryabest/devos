import { describe, expect, it } from 'vitest';
import { createTestApp } from '../test/test-app.js';

describe('health load smoke', () => {
  it('handles 50 concurrent /health requests', async () => {
    const app = await createTestApp();
    const requests = Array.from({ length: 50 }, () =>
      app.inject({ method: 'GET', url: '/health' }),
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.statusCode).toBe(200);
    }
    await app.close();
  });
});
