import { useSettingsStore, type WebhookEvent } from '@/stores/settings-store';

export type { WebhookEvent };

export async function dispatchWebhooks(event: WebhookEvent, payload: Record<string, unknown>) {
  const hooks = useSettingsStore.getState().webhooks.filter((h) => h.enabled && h.events.includes(event));
  if (hooks.length === 0) return;

  await Promise.allSettled(
    hooks.map((hook) =>
      fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(hook.secret ? { 'X-DevOS-Secret': hook.secret } : {}) },
        body: JSON.stringify({ event, payload, ts: new Date().toISOString() }),
      }),
    ),
  );
}
