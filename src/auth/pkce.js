
import { createHash, randomBytes } from 'node:crypto';

// Keep the verifier secret and send only its SHA-256 challenge to GitHub.
export function createPkcePair() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

export const createState = () => randomBytes(16).toString('base64url');
