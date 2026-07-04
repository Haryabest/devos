import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createTestApp } from '../test/test-app.js';

const secret = process.env.GITHUB_WEBHOOK_SECRET ?? 'test-webhook-secret-min16';

describe('GitHub webhook e2e', () => {
  it('verifies signature against raw request body, not re-serialized JSON', async () => {
    const app = await createTestApp();
    const rawBody = '  {"action":"push","repository":{"full_name":"devos/demo"}}  ';
    const signature = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

    const res = await app.inject({
      method: 'POST',
      url: '/api/integrations/github/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': signature,
        'x-github-event': 'push',
      },
      payload: rawBody,
    });

    expect(res.statusCode).toBe(200);
    await app.close();
  });

  it('rejects invalid signature when secret is configured', async () => {
    const app = await createTestApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/integrations/github/webhook',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': 'sha256=deadbeef',
        'x-github-event': 'push',
      },
      payload: '{"repository":{"full_name":"devos/demo"}}',
    });

    expect(res.statusCode).toBe(401);
    await app.close();
  });
});
