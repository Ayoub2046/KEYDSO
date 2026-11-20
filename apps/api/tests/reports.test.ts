import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Reports & Analytics Module', () => {
  let adminToken: string;
  let presidentToken: string;
  let financeToken: string;
  let facultyRepToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const [adminRes, presRes, financeRes, facRes, studentRes] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: 'admin@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'president@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'finance.a@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'csit.rep@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'student.demo@keydso.university.edu', password: 'StudentPass123!' }),
    ]);

    expect(adminRes.status).toBe(200);
    expect(presRes.status).toBe(200);
    expect(financeRes.status).toBe(200);
    expect(facRes.status).toBe(200);
    expect(studentRes.status).toBe(200);

    adminToken = adminRes.body.data.access_token;
    presidentToken = presRes.body.data.access_token;
    financeToken = financeRes.body.data.access_token;
    facultyRepToken = facRes.body.data.access_token;
    studentToken = studentRes.body.data.access_token;
  });

  // ─── 1. Financial Overview ───────────────────────────────────────────────────

  describe('GET /api/v1/reports/financial-overview', () => {
    it('should allow SYSTEM_ADMIN to access financial overview', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('total_expected_revenue');
      expect(data).toHaveProperty('total_collected_revenue');
      expect(data).toHaveProperty('collection_rate_percentage');
      expect(data).toHaveProperty('total_expenses_disbursed');
      expect(data).toHaveProperty('net_available_cash');
      expect(data).toHaveProperty('total_outstanding_debt');
      expect(data).toHaveProperty('campaign_breakdown');
      expect(data).toHaveProperty('faculty_collection_breakdown');
      expect(data).toHaveProperty('expense_category_breakdown');
      expect(data).toHaveProperty('cashflow_trend');
    });

    it('should allow GENERAL_PRESIDENT to access financial overview', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${presidentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_verified_transactions).toBeGreaterThanOrEqual(0);
    });

    it('should allow FINANCE_OFFICER to access financial overview', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${financeToken}`);

      expect(res.status).toBe(200);
    });

    it('should allow FACULTY_PRESIDENT to access a filtered financial overview', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${facultyRepToken}`);

      expect(res.status).toBe(200);
    });

    it('should DENY student from accessing financial overview', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should DENY unauthenticated requests', async () => {
      const res = await request(app).get('/api/v1/reports/financial-overview');
      expect(res.status).toBe(401);
    });

    it('cashflow trend items should have correct period format (YYYY-MM)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const trend = res.body.data.cashflow_trend as any[];
      if (trend.length > 0) {
        trend.forEach((t) => {
          expect(t.period).toMatch(/^\d{4}-\d{2}$/);
          expect(typeof t.credits).toBe('number');
          expect(typeof t.debits).toBe('number');
          expect(t.net).toBe(Number((t.credits - t.debits).toFixed(2)));
        });
      }
    });

    it('campaign_breakdown items should have required fields', async () => {
      const res = await request(app)
        .get('/api/v1/reports/financial-overview')
        .set('Authorization', `Bearer ${adminToken}`);

      const campaigns = res.body.data.campaign_breakdown as any[];
      expect(campaigns.length).toBeGreaterThan(0);
      campaigns.forEach((c) => {
        expect(c).toHaveProperty('campaign_id');
        expect(c).toHaveProperty('title');
        expect(c).toHaveProperty('collected_amount');
        expect(c).toHaveProperty('collection_rate');
        expect(c.collection_rate).toBeGreaterThanOrEqual(0);
        expect(c.collection_rate).toBeLessThanOrEqual(100);
      });
    });
  });

  // ─── 2. Faculty Performance ──────────────────────────────────────────────────

  describe('GET /api/v1/reports/faculty-performance', () => {
    it('should return faculty performance rankings for admin', async () => {
      const res = await request(app)
        .get('/api/v1/reports/faculty-performance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const faculties = res.body.data as any[];
      expect(Array.isArray(faculties)).toBe(true);
      expect(faculties.length).toBeGreaterThan(0);

      faculties.forEach((f) => {
        expect(f).toHaveProperty('faculty_id');
        expect(f).toHaveProperty('faculty_name');
        expect(f).toHaveProperty('collection_rate');
        expect(f).toHaveProperty('resolution_rate');
        expect(f).toHaveProperty('performance_score');
        expect(f.performance_score).toBeGreaterThanOrEqual(0);
        expect(f.performance_score).toBeLessThanOrEqual(100);
      });
    });

    it('should return faculties sorted by performance_score descending', async () => {
      const res = await request(app)
        .get('/api/v1/reports/faculty-performance')
        .set('Authorization', `Bearer ${adminToken}`);

      const faculties = res.body.data as any[];
      if (faculties.length >= 2) {
        for (let i = 0; i < faculties.length - 1; i++) {
          expect(faculties[i].performance_score).toBeGreaterThanOrEqual(faculties[i + 1].performance_score);
        }
      }
    });

    it('should DENY student from faculty performance report', async () => {
      const res = await request(app)
        .get('/api/v1/reports/faculty-performance')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 3. Governance Analytics ─────────────────────────────────────────────────

  describe('GET /api/v1/reports/governance-analytics', () => {
    it('should return committee governance analytics for admin', async () => {
      const res = await request(app)
        .get('/api/v1/reports/governance-analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data).toHaveProperty('total_committees');
      expect(data).toHaveProperty('total_active_members');
      expect(data).toHaveProperty('total_tasks_assigned');
      expect(data).toHaveProperty('tasks_completed');
      expect(data).toHaveProperty('task_completion_rate');
      expect(data).toHaveProperty('committee_breakdowns');
      expect(data).toHaveProperty('meeting_analytics');
      expect(data.total_committees).toBeGreaterThanOrEqual(2); // seeded 2 committees
    });

    it('should include meetings_by_type breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/reports/governance-analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      const data = res.body.data;
      expect(data.meeting_analytics).toHaveProperty('meetings_by_type');
      expect(typeof data.meeting_analytics.meetings_by_type).toBe('object');
    });

    it('committee_breakdowns should include completion rates', async () => {
      const res = await request(app)
        .get('/api/v1/reports/governance-analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      const breakdowns = res.body.data.committee_breakdowns as any[];
      breakdowns.forEach((b) => {
        expect(b).toHaveProperty('completion_rate');
        expect(b.completion_rate).toBeGreaterThanOrEqual(0);
        expect(b.completion_rate).toBeLessThanOrEqual(100);
      });
    });

    it('should allow faculty president to access governance analytics', async () => {
      const res = await request(app)
        .get('/api/v1/reports/governance-analytics')
        .set('Authorization', `Bearer ${facultyRepToken}`);

      expect(res.status).toBe(200);
    });

    it('should DENY student from governance analytics', async () => {
      const res = await request(app)
        .get('/api/v1/reports/governance-analytics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 4. Audit Export ─────────────────────────────────────────────────────────

  describe('GET /api/v1/reports/audit-export', () => {
    it('should generate a comprehensive audit export for admin', async () => {
      const res = await request(app)
        .get('/api/v1/reports/audit-export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data).toHaveProperty('generated_at');
      expect(data).toHaveProperty('generated_by');
      expect(data).toHaveProperty('report_type');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('ledger_verification');
      expect(data.ledger_verification).toHaveProperty('checksum');
      expect(data.ledger_verification).toHaveProperty('reconciled');
      expect(data.ledger_verification.checksum.length).toBe(64); // SHA-256 hex
    });

    it('ledger should be reconciled (credits - debits = balance)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/audit-export')
        .set('Authorization', `Bearer ${adminToken}`);

      const lv = res.body.data.ledger_verification;
      expect(lv.reconciled).toBe(true);
    });

    it('audit summary should include all key institutional metrics', async () => {
      const res = await request(app)
        .get('/api/v1/reports/audit-export')
        .set('Authorization', `Bearer ${adminToken}`);

      const summary = res.body.data.summary;
      expect(summary).toHaveProperty('total_students_enrolled');
      expect(summary).toHaveProperty('verified_payments_count');
      expect(summary).toHaveProperty('expenses_disbursed_volume');
      expect(summary).toHaveProperty('welfare_cases_count');
    });

    it('should DENY student from accessing audit export', async () => {
      const res = await request(app)
        .get('/api/v1/reports/audit-export')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should DENY faculty rep from accessing audit export', async () => {
      const res = await request(app)
        .get('/api/v1/reports/audit-export')
        .set('Authorization', `Bearer ${facultyRepToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─── 5. CSV Export ───────────────────────────────────────────────────────────

  describe('GET /api/v1/reports/export/financial-csv', () => {
    it('should return CSV data with correct Content-Type for admin', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export/financial-csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.csv');
      expect(typeof res.text).toBe('string');
      expect(res.text).toContain('KEYDSO MAANTA');
      expect(res.text).toContain('Total Expected Revenue');
      expect(res.text).toContain('FACULTY COLLECTION BREAKDOWN');
    });

    it('should include verified transactions in CSV export', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export/financial-csv')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.text).toContain('VERIFIED PAYMENT TRANSACTIONS');
    });

    it('should DENY student from downloading financial CSV', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export/financial-csv')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should DENY faculty rep from downloading financial CSV', async () => {
      const res = await request(app)
        .get('/api/v1/reports/export/financial-csv')
        .set('Authorization', `Bearer ${facultyRepToken}`);

      expect(res.status).toBe(403);
    });
  });
});
