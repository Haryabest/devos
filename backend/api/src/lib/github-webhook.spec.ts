import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyGithubWebhookSignature } from './github-webhook.js';

describe('verifyGithubWebhookSignature', () => {
  const secret = 'webhook-secret';
  const payload = '{"action":"push"}';

  it('accepts valid sha256 signature', () => {
    const sig = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
    expect(verifyGithubWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it('rejects invalid signature', () => {
    expect(verifyGithubWebhookSignature(payload, 'sha256=bad', secret)).toBe(false);
  });

  it('skips verification when secret is not configured', () => {
    expect(verifyGithubWebhookSignature(payload, undefined, undefined)).toBe(true);
  });

  it('rejects missing signature when secret is set', () => {
    expect(verifyGithubWebhookSignature(payload, undefined, secret)).toBe(false);
  });
});
