import { InMemoryRepository } from "./in-memory.repository.js";

export class UsersRepository extends InMemoryRepository {
  async findByEmail(email) {
    const normalizedEmail = email.toLowerCase();

    const users = await this.findAll();

    return (
      users.find(
        (user) => user.email.toLowerCase() === normalizedEmail,
      ) ?? null
    );
  }
}