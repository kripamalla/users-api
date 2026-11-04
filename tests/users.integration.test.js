
import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';

import { createApp } from '../src/app.js';
import { createContainer } from '../src/container.js';

describe('Users API authorization', () => {
  let app;
  let container;
  let admin;
  let customer;
  let anotherCustomer;
  let adminToken;
  let customerToken;

  const testPassword = 'TestPassword123!';

  beforeEach(async () => {
    container = createContainer({
      auth: {
        jwtSecret: 'test-secret-that-is-at-least-32-characters-long',
        accessTokenTtlSeconds: 900,
        issuer: 'users-api',
        audience: 'users-api',
      },
      hashPassword: async (password) => `hashed:${password}`,
      verifyPassword: async (password, hash) =>
        hash === `hashed:${password}`,
    });

    app = createApp(container);

    admin = await container.usersService.create(
      {
        firstName: 'Admin',
        lastName: 'Tester',
        email: 'admin@test.com',
        password: testPassword,
      },
      { role: 'admin' },
    );

    customer = await container.usersService.create({
      firstName: 'Customer',
      lastName: 'One',
      email: 'customer@test.com',
      password: testPassword,
    });

    anotherCustomer = await container.usersService.create({
      firstName: 'Customer',
      lastName: 'Two',
      email: 'another@test.com',
      password: testPassword,
    });

    adminToken = container.tokenService.signAccessToken(admin);
    customerToken = container.tokenService.signAccessToken(customer);
  });

  it('allows an admin to read another user', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${customer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(customer.id);
  });

  it('allows a customer to read their own account', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${customer.id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(customer.id);
  });

  it('prevents a customer from reading another user', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${anotherCustomer.id}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
  });

  it('allows an admin to list users', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
  });

  it('prevents a customer from listing users', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(response.status).toBe(403);
  });

  it('prevents unauthenticated access', async () => {
    const response = await request(app)
      .get(`/api/v1/users/${customer.id}`);

    expect(response.status).toBe(401);
  });

  it('prevents an admin from deleting themselves', async () => {
    const response = await request(app)
      .delete(`/api/v1/users/${admin.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(403);
  });

  it('allows an admin to delete another user', async () => {
    const response = await request(app)
      .delete(`/api/v1/users/${anotherCustomer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
  });

  it('allows a customer to change their password', async () => {
    const response = await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        currentPassword: testPassword,
        newPassword: 'NewPassword123!',
      });

    expect(response.status).toBe(204);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: customer.email,
        password: 'NewPassword123!',
      });

    expect(login.status).toBe(200);
  });

  it('rejects a password change with an incorrect current password', async () => {
    const response = await request(app)
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      });

    expect(response.status).toBe(401);
  });
});
