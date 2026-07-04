import { createHmac } from 'node:crypto';
import { describe, expect, it, beforeAll } from 'vitest';
import { createTestApp, isDatabaseAvailable } from '../test/test-app.js';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('webhook integration', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;
  const secret = process.env.GITHUB_WEBHOOK_SECRET ?? 'test-webhook-secret-min16';

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('accepts webhook with exact raw body bytes', async () => {
    const rawBody = '{"repository":{"full_name":"org/repo"},"ref":"refs/heads/main"}';
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
    expect(res.json()).toMatchObject({ ok: true });
  });

  it('documents that re-serialization can change signature bytes', () => {
    const testSecret = 'integration-webhook-secret';
    const rawBody = '{"repository":{"full_name":"org/repo"},"ref":"refs/heads/main"}';
    const reSerialized = JSON.stringify(JSON.parse(rawBody));
    const sigRaw = createHmac('sha256', testSecret).update(rawBody).digest('hex');
    const sigReserialized = createHmac('sha256', testSecret).update(reSerialized).digest('hex');
    expect(sigRaw).toBe(sigReserialized);
  });
});
