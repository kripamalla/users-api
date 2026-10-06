export class InMemoryRepository {
  constructor() {
    this.items = new Map();
  }

  async create(item) {
    this.items.set(item.id, structuredClone(item));

    return structuredClone(item);
  }

  async findById(id) {
    const item = this.items.get(id);

    return item ? structuredClone(item) : null;
  }

  async findAll() {
    return structuredClone([...this.items.values()]);
  }

  async update(id, changes) {
    const existing = this.items.get(id);

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...changes,
    };

    this.items.set(id, structuredClone(updated));

    return structuredClone(updated);
  }

  async delete(id) {
    return this.items.delete(id);
  }
}