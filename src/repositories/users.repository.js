import { InMemoryRepository } from './in-memory.repository.js';

export class UsersRepository extends InMemoryRepository {
  findByEmail(email) {
    const normalizedEmail = email.toLowerCase();

    return this.findOne(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );
  }

  findByGithubId(githubId) {
    return this.findOne((user) => user.githubId === githubId);
  }
}