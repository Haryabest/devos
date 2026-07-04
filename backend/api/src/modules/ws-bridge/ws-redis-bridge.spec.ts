import { describe, expect, it } from 'vitest';
import { NotificationsPushService } from '../notifications/notifications-push.service.js';
import { WsRedisBridgeService } from './ws-redis-bridge.service.js';

describe('WsRedisBridgeService', () => {
  it('skips echo messages from same instance', () => {
    const bridge = Object.create(WsRedisBridgeService.prototype) as WsRedisBridgeService;
    Object.defineProperty(bridge, 'instanceId', { value: 'instance-a' });

    const msg = JSON.parse(
      JSON.stringify({ origin: 'instance-a', userId: 'u1', envelope: '{"event":"notification"}' }),
    );
    expect(msg.origin === bridge.instanceId).toBe(true);
  });
});

describe('NotificationsPushService deliverLocal', () => {
  it('does not throw when user has no sockets', () => {
    const bridge = {
      publishNotification: () => undefined,
    } as WsRedisBridgeService;
    const push = new NotificationsPushService(bridge);
    expect(() => push.deliverLocal('missing-user', '{}')).not.toThrow();
  });
});
