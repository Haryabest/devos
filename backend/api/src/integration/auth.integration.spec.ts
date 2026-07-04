import { randomUUID } from 'node:crypto';
import { describe, expect, it, beforeAll } from 'vitest';
import { createTestApp, isDatabaseAvailable } from '../test/test-app.js';

const dbReady = await isDatabaseAvailable();

describe.skipIf(!dbReady)('auth integration', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('registers a user, returns tokens and /auth/me works', async () => {
    const email = `test-${randomUUID()}@devos.local`;
    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email,
        password: 'TestPassword123!',
        name: 'Integration User',
      },
    });
    expect(register.statusCode).toBe(201);
    const { tokens, user } = register.json() as {
      tokens: { accessToken: string; refreshToken: string };
      user: { email: string };
    };
    expect(user.email).toBe(email);
    expect(tokens.accessToken).toBeTruthy();

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ email });
  });

  it('refreshes access token', async () => {
    const email = `refresh-${randomUUID()}@devos.local`;
    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email,
        password: 'TestPassword123!',
        name: 'Refresh User',
      },
    });
    const { tokens } = register.json() as { tokens: { refreshToken: string } };

    const refresh = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: tokens.refreshToken },
    });
    expect(refresh.statusCode).toBe(200);
    const { tokens: refreshed } = refresh.json() as {
      tokens: { accessToken: string; refreshToken: string };
    };
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.refreshToken).toBeTruthy();
  });
});
