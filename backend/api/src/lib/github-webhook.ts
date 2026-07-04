import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyGithubWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string | undefined,
): boolean {
  if (!secret) return true;
  if (!signature) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
