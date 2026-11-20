import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('OWASP ASVS & Application Security Verification Suite — Phase 7', () => {
  let adminToken: string;
  let csitRepToken: string;
  let engRepToken: string;
  let studentToken: string;
  let financeOfficerAToken: string;

  beforeAll(async () => {
    const [adminRes, csitRes, engRes, stuRes, finARes] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({
        email: 'admin@keydso.university.edu',
        password: 'AdminPass123!',
      }),
      request(app).post('/api/v1/auth/login').send({
        email: 'csit.rep@keydso.university.edu',
        password: 'AdminPass123!',
      }),
      request(app).post('/api/v1/auth/login').send({
        email: 'eng.rep@keydso.university.edu',
        password: 'AdminPass123!',
      }),
      request(app).post('/api/v1/auth/login').send({
        email: 'student.demo@keydso.university.edu',
        password: 'StudentPass123!',
      }),
      request(app).post('/api/v1/auth/login').send({
        email: 'finance.a@keydso.university.edu',
        password: 'AdminPass123!',
      }),
    ]);

    expect(adminRes.status).toBe(200);
    expect(csitRes.status).toBe(200);
    expect(engRes.status).toBe(200);
    expect(stuRes.status).toBe(200);
    expect(finARes.status).toBe(200);

    adminToken = adminRes.body.data.access_token;
    csitRepToken = csitRes.body.data.access_token;
    engRepToken = engRes.body.data.access_token;
    studentToken = stuRes.body.data.access_token;
    financeOfficerAToken = finARes.body.data.access_token;
  });

  // 1. HTTP Security Headers (OWASP ASVS V14)
  describe('Security Headers & Transport Security', () => {
    it('should include Content-Security-Policy header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).toHaveProperty('content-security-policy');
      expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should include X-Content-Type-Options: nosniff header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options to prevent Clickjacking', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).toHaveProperty('x-frame-options');
    });
  });

  // 2. Cross-Faculty IDOR Prevention
  describe('Cross-Faculty IDOR (Insecure Direct Object Reference) Protection', () => {
    it('CSIT Faculty President must not be able to resolve Engineering Faculty challenges', async () => {
      const engineeringIssueId = 'a3000000-0000-0000-0000-000000000002';
      const res = await request(app)
        .post(`/api/v1/governance/issues/${engineeringIssueId}/resolve`)
        .set('Authorization', `Bearer ${csitRepToken}`)
        .send({
          resolution_notes: 'Unauthorized attempt to resolve cross-faculty engineering challenge',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Cross-Faculty Security Violation');
    });
  });

  // 3. Four-Eyes Financial Segregation of Duties
  describe('Financial Four-Eyes Verification Enforcement', () => {
    it('should strictly reject self-verification of recorded payments', async () => {
      // 1. Record payment as Finance Officer A
      const recordRes = await request(app)
        .post('/api/v1/finance/payments')
        .set('Authorization', `Bearer ${financeOfficerAToken}`)
        .send({
          student_id: '90000000-0000-0000-0000-000000000001',
          campaign_id: '70000000-0000-0000-0000-000000000001',
          amount: 25.0,
          payment_method: 'CASH',
          transaction_reference: `SEC-TEST-${Date.now()}`,
          idempotency_key: `sec-idemp-${Date.now()}`,
        });

      expect(recordRes.status).toBe(201);
      const paymentId = recordRes.body.data.id;

      // 2. Attempt to verify payment with SAME officer (Finance Officer A)
      const verifyRes = await request(app)
        .post(`/api/v1/finance/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${financeOfficerAToken}`);

      expect(verifyRes.status).toBe(403);
      expect(verifyRes.body.error.message).toContain('Separation of Duties Violation');
    });
  });

  // 4. Confidential Welfare & Hardship Segregation
  describe('Confidential Student Hardship Privacy Guarantee', () => {
    it('student portal transparency feed must NEVER expose confidential welfare cases', async () => {
      const res = await request(app)
        .get('/api/v1/portal/transparency')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);

      const items = res.body.data as any[];
      items.forEach((item) => {
        // Must only show public approved expenses, never welfare hardship reasons
        expect(item).not.toHaveProperty('confidential_reason');
        expect(item).not.toHaveProperty('student_id');
      });
    });

    it('unauthorized users cannot query welfare cases', async () => {
      const res = await request(app)
        .get('/api/v1/finance/welfare')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // 5. Input Validation & SQLi / Malformed Payloads
  describe('Input Validation & Malicious Payloads', () => {
    it('should reject SQL injection payloads in UUID route parameters', async () => {
      const maliciousId = "70000000-0000-0000-0000-000000000001' OR '1'='1";
      const res = await request(app)
        .get(`/api/v1/finance/campaigns/${encodeURIComponent(maliciousId)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject malformed JSON bodies without server crash', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken-json');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MALFORMED_JSON');
    });
  });

  // 6. Cryptographic Receipt Verification
  describe('HMAC Receipt Tamper Detection', () => {
    it('should verify legitimate receipt HMAC', async () => {
      const res = await request(app)
        .get('/api/v1/portal/receipts/REC-2026-0001')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('signature_hash');
      expect(res.body.data.signature_hash.length).toBe(64);
    });

    it('should return 404 for tampered receipt number', async () => {
      const res = await request(app)
        .get('/api/v1/portal/receipts/REC-TAMPERED-9999')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(404);
    });
  });
});
