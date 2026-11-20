import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Student Portal & Transparency API', () => {
  let studentToken: string;
  let adminToken: string;

  it('Setup: login as demo student', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student.demo@keydso.university.edu',
        password: 'StudentPass123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.access_token).toBeDefined();
    studentToken = loginRes.body.data.access_token;
  });

  it('Setup: login as admin', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@keydso.university.edu',
        password: 'AdminPass123!',
      });
    adminToken = loginRes.body.data.access_token;
  });

  it('GET /api/v1/portal/overview — returns personal academic and financial status', async () => {
    const res = await request(app)
      .get('/api/v1/portal/overview')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.student).toBeDefined();
    expect(data.student.student_id_number).toBe('STU-2024-001');
    expect(data.student.faculty_name).toBeDefined();

    // Financial balance calculations
    expect(data.total_expected).toBeGreaterThanOrEqual(25);
    expect(data.total_paid).toBeGreaterThanOrEqual(25);
    expect(data.total_remaining).toBe(0);
    expect(data.overall_status).toBe('PAID');

    // Receipts
    expect(data.recent_receipts.length).toBeGreaterThanOrEqual(1);
    expect(data.recent_receipts[0].receipt_number).toBe('REC-2026-0001');

    // Representatives
    expect(data.representatives.length).toBeGreaterThanOrEqual(2); // General President + CSIT Faculty President
  });

  it('GET /api/v1/portal/representatives — returns verified representative contact pathways', async () => {
    const res = await request(app)
      .get('/api/v1/portal/representatives?faculty_id=30000000-0000-0000-0000-000000000002')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const reps = res.body.data;
    expect(reps.length).toBeGreaterThanOrEqual(2);

    const genPres = reps.find((r: any) => r.role_title.includes('General Council President'));
    expect(genPres).toBeDefined();
    expect(genPres.contact_number).toBeDefined();
    expect(genPres.whatsapp_number).toBeDefined();

    const facPres = reps.find((r: any) => r.role_title.includes('Faculty President'));
    expect(facPres).toBeDefined();
    expect(facPres.email).toBeDefined();
  });

  it('GET /api/v1/portal/receipts/:receiptNumber — student can fetch their own verified receipt', async () => {
    const res = await request(app)
      .get('/api/v1/portal/receipts/REC-2026-0001')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.receipt_number).toBe('REC-2026-0001');
    expect(res.body.data.student_id_number).toBe('STU-2024-001');
    expect(res.body.data.signature_hash).toBeDefined();
  });

  it('POST /api/v1/portal/feedback — student can submit a concern / challenge to representatives', async () => {
    const res = await request(app)
      .post('/api/v1/portal/feedback')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Projector Defect in Computing Lab 3',
        category: 'INFRASTRUCTURE',
        priority: 'MEDIUM',
        description: 'The overhead projector in Lab 3 displays red tint artifacts during software engineering lectures.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reference_number).toContain('ISSUE-');
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  it('GET /api/v1/portal/transparency — students can inspect itemized purchases and vendor evidence', async () => {
    const res = await request(app)
      .get('/api/v1/portal/transparency')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const items = res.body.data;
    expect(items.length).toBeGreaterThanOrEqual(1);

    const sample = items[0];
    expect(sample.campaign_title).toBeDefined();
    expect(sample.vendor_name).toBeDefined();
    expect(sample.amount).toBeGreaterThan(0);
    expect(sample.evidence_files.length).toBeGreaterThanOrEqual(1);
    expect(sample.evidence_files[0].file_name).toContain('.pdf');
  });
});
