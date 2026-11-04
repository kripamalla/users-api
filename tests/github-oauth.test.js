
import { describe, expect, it, vi } from 'vitest';
import { GithubOAuthClient } from '../src/services/github-oauth.client.js';

const credentials = {
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  callbackUrl: 'http://localhost:3000/api/v1/auth/github/callback',
};

describe('GitHub OAuth client', () => {
  it('reports whether GitHub OAuth is configured', () => {
    const configured = new GithubOAuthClient(credentials);
    const unconfigured = new GithubOAuthClient({
      clientId: '',
      clientSecret: '',
      callbackUrl: credentials.callbackUrl,
    });

    expect(configured.isConfigured).toBe(true);
    expect(unconfigured.isConfigured).toBe(false);
  });

  it('builds an authorization URL with state and PKCE', () => {
    const client = new GithubOAuthClient(credentials);

    const url = new URL(
      client.buildAuthorizeUrl({
        state: 'test-state',
        codeChallenge: 'test-challenge',
      }),
    );

    expect(url.origin).toBe('https://github.com');
    expect(url.pathname).toBe('/login/oauth/authorize');
    expect(url.searchParams.get('client_id')).toBe(credentials.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(credentials.callbackUrl);
    expect(url.searchParams.get('state')).toBe('test-state');
    expect(url.searchParams.get('code_challenge')).toBe('test-challenge');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toBe('read:user user:email');
  });

  it('exchanges an authorization code for an access token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'github-access-token' }),
    });

    const client = new GithubOAuthClient(credentials, {
      fetch: fetchMock,
    });

    const token = await client.exchangeCode({
      code: 'authorization-code',
      codeVerifier: 'pkce-verifier',
    });

    expect(token).toBe('github-access-token');
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://github.com/login/oauth/access_token');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);

    expect(body.client_id).toBe(credentials.clientId);
    expect(body.client_secret).toBe(credentials.clientSecret);
    expect(body.code).toBe('authorization-code');
    expect(body.code_verifier).toBe('pkce-verifier');
  });

  it('rejects an unsuccessful authorization code exchange', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'bad_verification_code' }),
    });

    const client = new GithubOAuthClient(credentials, {
      fetch: fetchMock,
    });

    await expect(
      client.exchangeCode({
        code: 'invalid-code',
        codeVerifier: 'pkce-verifier',
      }),
    ).rejects.toThrow('GitHub login failed');
  });

  it('retrieves the GitHub profile and verified primary email', async () => {
    const fetchMock = vi.fn()
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
            email: 'secondary@example.com',
            primary: false,
            verified: true,
          },
          {
            email: 'test@example.com',
            primary: true,
            verified: true,
          },
        ],
      });

    const client = new GithubOAuthClient(credentials, {
      fetch: fetchMock,
    });

    const profile = await client.getProfile('github-access-token');

    expect(profile).toEqual({
      githubId: '12345',
      login: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects a GitHub account without a verified primary email', async () => {
    const fetchMock = vi.fn()
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
            verified: false,
          },
        ],
      });

    const client = new GithubOAuthClient(credentials, {
      fetch: fetchMock,
    });

    await expect(
      client.getProfile('github-access-token'),
    ).rejects.toThrow('no verified primary email');
  });

  it('rejects failed GitHub profile requests', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    const client = new GithubOAuthClient(credentials, {
      fetch: fetchMock,
    });

    await expect(
      client.getProfile('invalid-token'),
    ).rejects.toThrow('Could not read GitHub profile');
  });
});
