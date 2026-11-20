import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Academic Structure API', () => {
  let adminToken: string;

  it('Setup: obtain admin token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@keydso.university.edu',
        password: 'AdminPass123!',
      });
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.access_token;
  });

  it('GET /api/v1/academic/faculties — lists seeded faculties', async () => {
    const res = await request(app)
      .get('/api/v1/academic/faculties')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    const codes = res.body.data.map((f: any) => f.code);
    expect(codes).toContain('ENG');
    expect(codes).toContain('CSIT');
  });

  it('POST /api/v1/academic/academic-years — rejects end_date <= start_date', async () => {
    const res = await request(app)
      .post('/api/v1/academic/academic-years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'AY-INVALID',
        name: 'Invalid Year',
        start_date: '2026-09-01',
        end_date: '2026-05-01', // Before start_date!
        is_current: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/academic/faculties — admin can create a new faculty', async () => {
    const res = await request(app)
      .post('/api/v1/academic/faculties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'LAW',
        name: 'Faculty of Law & Jurisprudence',
        description: 'Legal studies and public governance',
        is_active: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('LAW');
  });

  it('POST /api/v1/academic/faculties — rejects duplicate faculty code with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/academic/faculties')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'ENG', // Already exists!
        name: 'Duplicate Engineering Faculty',
        is_active: true,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
