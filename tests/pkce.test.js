
import { describe, expect, it } from 'vitest';
import { createPkcePair, createState } from '../src/auth/pkce.js';
import { createHash } from 'node:crypto';

describe('PKCE utilities', () => {
  it('generates a non-empty verifier and challenge', () => {
    const pair = createPkcePair();

    expect(pair.verifier).toBeTruthy();
    expect(pair.challenge).toBeTruthy();
  });

  it('generates a challenge using SHA-256', () => {
    const { verifier, challenge } = createPkcePair();

    const expectedChallenge = createHash('sha256')
      .update(verifier)
      .digest('base64url');

    expect(challenge).toBe(expectedChallenge);
  });

  it('generates a different verifier each time', () => {
    const first = createPkcePair();
    const second = createPkcePair();

    expect(first.verifier).not.toBe(second.verifier);
  });

  it('generates a different challenge for each verifier', () => {
    const first = createPkcePair();
    const second = createPkcePair();

    expect(first.challenge).not.toBe(second.challenge);
  });

  it('generates a non-empty OAuth state', () => {
    expect(createState()).toBeTruthy();
  });

  it('generates a unique OAuth state each time', () => {
    expect(createState()).not.toBe(createState());
  });
});
