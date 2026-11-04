
import { describe, it, expect } from 'vitest';
import { can } from '../src/auth/policies.js';

describe('User authorization policies', () => {
  const admin = { id: 'admin-1', role: 'admin' };
  const customer = { id: 'user-1', role: 'customer' };
  const anotherUser = { id: 'user-2', role: 'customer' };

  it('allows admins to read any user', () => {
    expect(can(admin, 'users:read', anotherUser)).toBe(true);
  });

  it('allows customers to read themselves', () => {
    expect(can(customer, 'users:read', customer)).toBe(true);
  });

  it('prevents customers from reading other users', () => {
    expect(can(customer, 'users:read', anotherUser)).toBe(false);
  });

  it('allows admins to update any user', () => {
    expect(can(admin, 'users:update', anotherUser)).toBe(true);
  });

  it('prevents customers from updating other users', () => {
    expect(can(customer, 'users:update', anotherUser)).toBe(false);
  });

  it('allows admins to delete other users', () => {
    expect(can(admin, 'users:delete', anotherUser)).toBe(true);
  });

  it('prevents admins from deleting themselves', () => {
    expect(can(admin, 'users:delete', admin)).toBe(false);
  });

  it('prevents customers from deleting users', () => {
    expect(can(customer, 'users:delete', anotherUser)).toBe(false);
  });

  it('rejects requests without an authenticated actor', () => {
    expect(can(null, 'users:read', customer)).toBe(false);
  });

  it('throws an error for unknown actions', () => {
    expect(() => can(admin, 'users:unknown', customer)).toThrow(
      'Unknown action "users:unknown"',
    );
  });
});
