import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Council & Committee Governance API — Phase 4', () => {
  let adminToken: string;
  let presidentToken: string;
  let csitRepToken: string;
  let engRepToken: string;
  let secretaryToken: string;
  let studentToken: string;

  let createdCommitteeId: string;
  let createdMeetingId: string;
  let createdIssueId: string;

  const SEED_AY_ID = '20000000-0000-0000-0000-000000000001';
  const SEED_CSIT_FACULTY_ID = '30000000-0000-0000-0000-000000000002';
  const SEED_ENG_FACULTY_ID = '30000000-0000-0000-0000-000000000001';
  const SEED_WELFARE_COMM_ID = 'a0000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    const [adminRes, presRes, csitRes, engRes, secRes, stuRes] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ email: 'admin@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'president@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'csit.rep@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'eng.rep@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'secretary@keydso.university.edu', password: 'AdminPass123!' }),
      request(app).post('/api/v1/auth/login').send({ email: 'student.demo@keydso.university.edu', password: 'StudentPass123!' }),
    ]);

    expect(adminRes.status).toBe(200);
    expect(presRes.status).toBe(200);
    expect(csitRes.status).toBe(200);
    expect(engRes.status).toBe(200);
    expect(secRes.status).toBe(200);
    expect(stuRes.status).toBe(200);

    adminToken = adminRes.body.data.access_token;
    presidentToken = presRes.body.data.access_token;
    csitRepToken = csitRes.body.data.access_token;
    engRepToken = engRes.body.data.access_token;
    secretaryToken = secRes.body.data.access_token;
    studentToken = stuRes.body.data.access_token;
  });

  // ===========================================================================
  // 1. COMMITTEES MANAGEMENT
  // ===========================================================================
  describe('Committees Management', () => {
    it('GET /api/v1/governance/committees — lists committees with member & task counts', async () => {
      const res = await request(app)
        .get('/api/v1/governance/committees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const welfare = res.body.data.find((c: any) => c.code === 'WELFARE');
      expect(welfare).toBeDefined();
      expect(welfare.member_count).toBeGreaterThanOrEqual(2);
      expect(welfare.task_count).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/governance/committees/:id — retrieves committee with membership list', async () => {
      const res = await request(app)
        .get(`/api/v1/governance/committees/${SEED_WELFARE_COMM_ID}`)
        .set('Authorization', `Bearer ${csitRepToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(SEED_WELFARE_COMM_ID);
      expect(Array.isArray(res.body.data.members)).toBe(true);
      expect(res.body.data.members.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.members[0].user_name).toBeDefined();
    });

    it('POST /api/v1/governance/committees — President creates a new committee', async () => {
      const res = await request(app)
        .post('/api/v1/governance/committees')
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({
          name: 'Sports and Cultural Activities Committee',
          code: 'SPORTS',
          mandate: 'Organize inter-faculty football tournaments, athletics, and cultural exhibitions.',
          academic_year_id: SEED_AY_ID,
        });

      if (res.status !== 201) {
        console.error('DEBUG ERROR:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('SPORTS');
      createdCommitteeId = res.body.data.id;
    });

    it('POST /api/v1/governance/committees — duplicate code returns 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/v1/governance/committees')
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({
          name: 'Duplicate Sports Committee',
          code: 'SPORTS',
          mandate: 'Duplicate code should be rejected by conflict guard.',
          academic_year_id: SEED_AY_ID,
        });

      expect(res.status).toBe(409);
    });

    it('POST /api/v1/governance/committees — Student cannot create committee (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/governance/committees')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Unauthorized Student Club',
          code: 'STUDENT-CLUB',
          mandate: 'Should be blocked by committee creation RBAC.',
          academic_year_id: SEED_AY_ID,
        });

      expect(res.status).toBe(403);
    });

    it('POST /api/v1/governance/committees/:id/members — assigns member to committee', async () => {
      const res = await request(app)
        .post(`/api/v1/governance/committees/${createdCommitteeId}/members`)
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({
          user_id: '00000000-0000-0000-0000-000000000005', // csitRep
          role_in_committee: 'COORDINATOR',
        });

      if (res.status !== 201) {
        console.error('DEBUG ERROR:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.data.role_in_committee).toBe('COORDINATOR');
    });

    it('POST /api/v1/governance/committees/:id/members — duplicate assignment returns 409', async () => {
      const res = await request(app)
        .post(`/api/v1/governance/committees/${createdCommitteeId}/members`)
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({
          user_id: '00000000-0000-0000-0000-000000000005',
          role_in_committee: 'COORDINATOR',
        });

      expect(res.status).toBe(409);
    });

    it('DELETE /api/v1/governance/committees/:id/members/:userId — removes member', async () => {
      const res = await request(app)
        .delete(`/api/v1/governance/committees/${createdCommitteeId}/members/00000000-0000-0000-0000-000000000005`)
        .set('Authorization', `Bearer ${presidentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.removed).toBe(true);
    });
  });

  // ===========================================================================
  // 2. COMMITTEE TASKS
  // ===========================================================================
  describe('Committee Tasks Tracking', () => {
    let createdTaskId: string;

    it('GET /api/v1/governance/tasks — lists committee tasks with assigned officer', async () => {
      const res = await request(app)
        .get('/api/v1/governance/tasks')
        .set('Authorization', `Bearer ${csitRepToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].committee_name).toBeDefined();
    });

    it('POST /api/v1/governance/tasks — assigns a new committee task', async () => {
      const res = await request(app)
        .post('/api/v1/governance/tasks')
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({
          committee_id: createdCommitteeId,
          title: 'Prepare Annual University Sports Tournament Budget',
          description: 'Draft requisition for soccer balls, jerseys, and field referee stipends.',
          due_date: '2026-04-15',
        });

      if (res.status !== 201) {
        console.error('DEBUG ERROR:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('TODO');
      createdTaskId = res.body.data.id;
    });

    it('PATCH /api/v1/governance/tasks/:id/status — updates task progress', async () => {
      const res = await request(app)
        .patch(`/api/v1/governance/tasks/${createdTaskId}/status`)
        .set('Authorization', `Bearer ${csitRepToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });
  });

  // ===========================================================================
  // 3. MEETINGS & TRAINING SESSIONS
  // ===========================================================================
  describe('Meetings & Training Lifecycle', () => {
    it('GET /api/v1/governance/meetings — lists council and faculty meetings', async () => {
      const res = await request(app)
        .get('/api/v1/governance/meetings')
        .set('Authorization', `Bearer ${secretaryToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/v1/governance/meetings — Faculty President submits meeting request', async () => {
      const res = await request(app)
        .post('/api/v1/governance/meetings')
        .set('Authorization', `Bearer ${csitRepToken}`)
        .send({
          title: 'Computing Lab Accreditation & Hardware Strategy Meeting',
          type: 'FACULTY_MEETING',
          faculty_id: SEED_CSIT_FACULTY_ID,
          academic_year_id: SEED_AY_ID,
          scheduled_date: '2026-04-10',
          start_time: '09:00',
          end_time: '11:00',
          venue: 'IT Complex Room 201',
          agenda: 'Formal review of software licenses, AI workstation specs, and department requirements.',
          target_audience: 'FACULTY',
        });

      if (res.status !== 201) {
        console.error('DEBUG ERROR:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('REQUESTED');
      createdMeetingId = res.body.data.id;
    });

    it('POST /api/v1/governance/meetings/:id/review — President approves meeting request', async () => {
      const res = await request(app)
        .post(`/api/v1/governance/meetings/${createdMeetingId}/review`)
        .set('Authorization', `Bearer ${presidentToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.approved_by).toBeDefined();
    });

    it('POST /api/v1/governance/meetings/:id/minutes — Secretariat records minutes & resolutions', async () => {
      const res = await request(app)
        .post(`/api/v1/governance/meetings/${createdMeetingId}/minutes`)
        .set('Authorization', `Bearer ${secretaryToken}`)
        .send({
          minutes: 'Meeting commenced at 09:00. Faculty President presented hardware gaps. Agreed to prioritize 24 new workstations.',
          official_resolutions: '1. Recommended requisition to Finance Committee. 2. Scheduled follow-up inspection.',
          attendance_count: 14,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.attendance_count).toBe(14);
      expect(res.body.data.official_resolutions).toBeDefined();
    });

    it('Student cannot approve meeting requests (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/governance/meetings/${createdMeetingId}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'APPROVED' });

      expect(res.status).toBe(403);
    });
  });

  // ===========================================================================
  // 4. FACULTY CHALLENGES & CROSS-FACULTY ISOLATION GUARD
  // ===========================================================================
  describe('Faculty Challenges & Cross-Faculty Isolation Enforcement', () => {
    it('GET /api/v1/governance/issues — General President has university-wide visibility', async () => {
      const res = await request(app)
        .get('/api/v1/governance/issues')
        .set('Authorization', `Bearer ${presidentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const hasCsit = res.body.data.some((i: any) => i.faculty_id === SEED_CSIT_FACULTY_ID);
      const hasEng = res.body.data.some((i: any) => i.faculty_id === SEED_ENG_FACULTY_ID);
      expect(hasCsit).toBe(true);
      expect(hasEng).toBe(true);
    });

    it('GET /api/v1/governance/issues — CSIT Faculty President is scoped to CSIT challenges only', async () => {
      const res = await request(app)
        .get('/api/v1/governance/issues')
        .set('Authorization', `Bearer ${csitRepToken}`);

      expect(res.status).toBe(200);
      // All returned issues MUST belong to CSIT faculty
      for (const issue of res.body.data) {
        expect(issue.faculty_id).toBe(SEED_CSIT_FACULTY_ID);
      }
    });

    it('GET /api/v1/governance/issues?faculty_id=ENG — CSIT Faculty President accessing ENG issues returns 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/v1/governance/issues?faculty_id=${SEED_ENG_FACULTY_ID}`)
        .set('Authorization', `Bearer ${csitRepToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Cross-Faculty Security Violation/i);
    });

    it('POST /api/v1/governance/issues — Student registers a new challenge', async () => {
      const res = await request(app)
        .post('/api/v1/governance/issues')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          faculty_id: SEED_CSIT_FACULTY_ID,
          category: 'ACADEMIC',
          priority: 'HIGH',
          title: 'Database Systems Textbook Shortage in Library',
          description: 'Only 3 copies of Elmasri & Navathe 7th edition available for 240 students in third year.',
        });

      if (res.status !== 201) {
        console.error('DEBUG ERROR:', res.body);
      }
      expect(res.status).toBe(201);
      expect(res.body.data.reference_number).toMatch(/^ISS-\d{4}-\d{4}$/);
      expect(res.body.data.status).toBe('SUBMITTED');
      createdIssueId = res.body.data.id;
    });

    it('PATCH /api/v1/governance/issues/:id/status — CSIT rep marks issue IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/v1/governance/issues/${createdIssueId}/status`)
        .set('Authorization', `Bearer ${csitRepToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('POST /api/v1/governance/issues/:id/resolve — CSIT rep resolves issue with notes', async () => {
      const res = await request(app)
        .post(`/api/v1/governance/issues/${createdIssueId}/resolve`)
        .set('Authorization', `Bearer ${csitRepToken}`)
        .send({
          resolution_notes: 'Library director secured institutional access to digital IEEE/ACM and Springer eBook copies.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.data.resolved_at).toBeDefined();
    });

    it('POST /api/v1/governance/issues/:id/resolve — CSIT rep CANNOT resolve Engineering issue (403 Forbidden)', async () => {
      // Find an engineering issue
      const engIssueId = 'a3000000-0000-0000-0000-000000000002'; // Seeded Civil Eng issue

      const res = await request(app)
        .post(`/api/v1/governance/issues/${engIssueId}/resolve`)
        .set('Authorization', `Bearer ${csitRepToken}`)
        .send({ resolution_notes: 'Unauthorized cross-faculty resolution attempt' });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Cross-Faculty Security Violation/i);
    });
  });

  // ===========================================================================
  // 5. COUNCIL DASHBOARD OVERVIEW
  // ===========================================================================
  describe('Council Executive Dashboard', () => {
    it('GET /api/v1/governance/dashboard — returns aggregated council metrics', async () => {
      const res = await request(app)
        .get('/api/v1/governance/dashboard')
        .set('Authorization', `Bearer ${presidentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_students).toBeGreaterThanOrEqual(1);
      expect(res.body.data.total_faculties).toBeGreaterThanOrEqual(2);
      expect(res.body.data.active_committees_count).toBeGreaterThanOrEqual(2);
      expect(res.body.data.open_challenges_count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(res.body.data.upcoming_meetings)).toBe(true);
    });
  });
});
