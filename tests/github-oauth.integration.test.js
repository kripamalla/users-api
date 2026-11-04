
import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { createContainer } from '../src/container.js';

describe('GitHub OAuth integration', () => {
  let app;
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();

    const container = createContainer({
      auth: {
        jwtSecret: 'test-secret-that-is-at-least-32-characters-long',
        accessTokenTtlSeconds: 900,
        refreshTokenTtlDays: 7,
        issuer: 'users-api',
        audience: 'users-api',
      },
      github: {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        callbackUrl: 'http://localhost:3000/api/v1/auth/github/callback',
      },
      fetch: fetchMock,
      hashPassword: async (password) => `hashed:${password}`,
      verifyPassword: async (password, hash) =>
        hash === `hashed:${password}`,
    });

    app = createApp(container);
  });

  it('redirects to GitHub with state and PKCE parameters', async () => {
    const response = await request(app)
      .get('/api/v1/auth/github');

    expect(response.status).toBe(302);

    const url = new URL(response.headers.location);

    expect(url.origin).toBe('https://github.com');
    expect(url.pathname).toBe('/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('state')).toBeTruthy();
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');

    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('oauth_github');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('rejects a callback without the OAuth cookie', async () => {
    const response = await request(app)
      .get('/api/v1/auth/github/callback')
      .query({
        code: 'test-code',
        state: 'test-state',
      });

    expect(response.status).toBe(401);
  });

  it('rejects a callback with an invalid OAuth state', async () => {
    const response = await request(app)
      .get('/api/v1/auth/github/callback')
      .set(
        'Cookie',
        'oauth_github=' +
          encodeURIComponent(
            JSON.stringify({
              state: 'correct-state',
              verifier: 'test-verifier',
            }),
          ),
      )
      .query({
        code: 'test-code',
        state: 'wrong-state',
      });

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a callback without an authorization code', async () => {
    const response = await request(app)
      .get('/api/v1/auth/github/callback')
      .set(
        'Cookie',
        'oauth_github=' +
          encodeURIComponent(
            JSON.stringify({
              state: 'correct-state',
              verifier: 'test-verifier',
            }),
          ),
      )
      .query({
        state: 'correct-state',
      });

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a callback when the user cancels GitHub login', async () => {
    const response = await request(app)
      .get('/api/v1/auth/github/callback')
      .set(
        'Cookie',
        'oauth_github=' +
          encodeURIComponent(
            JSON.stringify({
              state: 'correct-state',
              verifier: 'test-verifier',
            }),
          ),
      )
      .query({
        error: 'access_denied',
      });

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('completes GitHub login and creates a user session', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'github-access-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          login: 'test-user',
          name: 'Test User',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            email: 'test@example.com',
            primary: true,
            verified: true,
          },
        ],
      });

    const state = 'valid-test-state';
    const verifier = 'valid-test-verifier';

    const response = await request(app)
      .get('/api/v1/auth/github/callback')
      .set(
        'Cookie',
        'oauth_github=' +
          encodeURIComponent(JSON.stringify({ state, verifier })),
      )
      .query({
        code: 'github-authorization-code',
        state,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('test@example.com');
    expect(response.body.data.accessToken).toBeTruthy();
    expect(response.body.data.tokenType).toBe('Bearer');
    expect(response.headers['set-cookie']).toBeDefined();

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
