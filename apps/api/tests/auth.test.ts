import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth & Security API', () => {
  it('POST /api/v1/auth/login — succeeds with valid seed admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@keydso.university.edu',
        password: 'AdminPass123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBeDefined();
    expect(res.body.data.roles).toContain('SYSTEM_ADMIN');
    expect(res.body.data.user.email).toBe('admin@keydso.university.edu');
    expect(res.body.data.user.password_hash).toBeUndefined(); // Zero sensitive password leakage
  });

  it('POST /api/v1/auth/login — rejects invalid password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@keydso.university.edu',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me — rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me — returns current authenticated profile with valid Bearer token', async () => {
    // First login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@keydso.university.edu',
        password: 'AdminPass123!',
      });

    const token = loginRes.body.data.access_token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('admin@keydso.university.edu');
    expect(meRes.body.data.roles).toContain('SYSTEM_ADMIN');
  });
});
