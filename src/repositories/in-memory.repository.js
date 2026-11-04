
import { randomUUID } from 'node:crypto';

export class InMemoryRepository {
  constructor() {
    this.items = new Map();
  }

  async findAll() {
    return Array.from(this.items.values()).map((item) => ({
      ...item,
    }));
  }

  async findById(id) {
    const item = this.items.get(id);

    return item ? { ...item } : null;
  }

  async findOne(predicate) {
    const items = await this.findAll();

    return items.find(predicate) ?? null;
  }

  async create(data) {
    const now = new Date().toISOString();

    const item = {
      id: data.id ?? randomUUID(),
      ...data,
      createdAt: data.createdAt ?? now,
      updatedAt: data.updatedAt ?? now,
    };

    this.items.set(item.id, item);

    return { ...item };
  }

  async update(id, changes) {
    const existing = this.items.get(id);

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...changes,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    this.items.set(id, updated);

    return { ...updated };
  }

  async delete(id) {
    const existing = this.items.get(id);

    if (!existing) {
      return null;
    }

    this.items.delete(id);

    return { ...existing };
  }

  async remove(id) {
    return this.delete(id);
  }
}
