import { InMemoryRepository } from './in-memory.repository.js';

export class RefreshTokensRepository extends InMemoryRepository {
  findByHash(tokenHash) {
    return this.findOne((row) => row.tokenHash === tokenHash);
  }

  async revokeWhere(predicate) {
    const now = new Date().toISOString();

    for (const row of await this.findAll()) {
      if (!row.revokedAt && predicate(row)) {
        await this.update(row.id, { revokedAt: now });
      }
    }
  }

  revokeFamily(familyId) {
    return this.revokeWhere((row) => row.familyId === familyId);
  }

  revokeAllForUser(userId) {
    return this.revokeWhere((row) => row.userId === userId);
  }
}