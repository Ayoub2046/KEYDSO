import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Student Directory & Bulk Import API', () => {
  let adminToken: string;
  let testFacultyId: string;
  let testDepartmentId: string;
  let testClassId: string;
  let testAcademicYearId: string;

  it('Setup: authenticate and extract academic foreign keys', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@keydso.university.edu',
        password: 'AdminPass123!',
      });
    adminToken = loginRes.body.data.access_token;

    const facRes = await request(app)
      .get('/api/v1/academic/faculties')
      .set('Authorization', `Bearer ${adminToken}`);
    testFacultyId = facRes.body.data[0].id;

    const deptRes = await request(app)
      .get(`/api/v1/academic/departments?faculty_id=${testFacultyId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    testDepartmentId = deptRes.body.data[0].id;

    const ayRes = await request(app)
      .get('/api/v1/academic/academic-years')
      .set('Authorization', `Bearer ${adminToken}`);
    testAcademicYearId = ayRes.body.data[0].id;

    const classRes = await request(app)
      .get(`/api/v1/academic/classes?department_id=${testDepartmentId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    if (classRes.body.data.length > 0) {
      testClassId = classRes.body.data[0].id;
    } else {
      const newClass = await request(app)
        .post('/api/v1/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          department_id: testDepartmentId,
          academic_year_id: testAcademicYearId,
          name: 'Class 2026',
        });
      testClassId = newClass.body.data.id;
    }
  });

  it('POST /api/v1/students — registers a single student', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id_number: 'STU-2026-001',
        full_name: 'Hassan Abdi Mohamed',
        faculty_id: testFacultyId,
        department_id: testDepartmentId,
        class_id: testClassId,
        academic_year_id: testAcademicYearId,
        contact_number: '+252 61 7123456',
        email: 'hassan.abdi@student.university.edu',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.student_id_number).toBe('STU-2026-001');
  });

  it('POST /api/v1/students — rejects duplicate student ID with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        student_id_number: 'STU-2026-001', // Already registered above
        full_name: 'Duplicate Student Name',
        faculty_id: testFacultyId,
        department_id: testDepartmentId,
        class_id: testClassId,
        academic_year_id: testAcademicYearId,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/students/import — dry-run previews rows without insertion', async () => {
    const batch = [
      {
        student_id_number: 'STU-BATCH-001',
        full_name: 'Amina Ali Warsame',
        faculty_code: 'CSIT',
        department_code: 'CS',
        class_name: 'Year 2 CS',
        email: 'amina.ali@student.university.edu',
      },
      {
        student_id_number: 'STU-BATCH-002',
        full_name: 'Mohamed Nur Farah',
        faculty_code: 'CSIT',
        department_code: 'CS',
        class_name: 'Year 2 CS',
      },
    ];

    const res = await request(app)
      .post('/api/v1/students/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academic_year_id: testAcademicYearId,
        records: batch,
        dry_run: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.is_dry_run).toBe(true);
    expect(res.body.data.total_rows).toBe(2);
    expect(res.body.data.valid_rows).toBe(2);
    expect(res.body.data.imported_count).toBe(0); // Not committed yet
  });

  it('POST /api/v1/students/import — reports error for invalid faculty or department code', async () => {
    const badBatch = [
      {
        student_id_number: 'STU-BAD-001',
        full_name: 'Test Student',
        faculty_code: 'NON_EXISTENT_FACULTY',
        department_code: 'NONE',
        class_name: 'Year 1',
      },
    ];

    const res = await request(app)
      .post('/api/v1/students/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academic_year_id: testAcademicYearId,
        records: badBatch,
        dry_run: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.error_count).toBe(1);
    expect(res.body.data.errors[0].field).toBe('faculty_code');
  });

  it('POST /api/v1/students/import — commits valid batch when dry_run is false', async () => {
    const batch = [
      {
        student_id_number: 'STU-LIVE-001',
        full_name: 'Zahra Omar Ahmed',
        faculty_code: 'CSIT',
        department_code: 'SE',
        class_name: 'Year 3 SE',
        email: 'zahra.omar@student.university.edu',
      },
      {
        student_id_number: 'STU-LIVE-002',
        full_name: 'Khalid Jama Hassan',
        faculty_code: 'CSIT',
        department_code: 'SE',
        class_name: 'Year 3 SE',
      },
    ];

    const res = await request(app)
      .post('/api/v1/students/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academic_year_id: testAcademicYearId,
        records: batch,
        dry_run: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.is_dry_run).toBe(false);
    expect(res.body.data.imported_count).toBe(2);

    // Verify they now appear in GET /api/v1/students
    const listRes = await request(app)
      .get('/api/v1/students?search=Zahra')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data.items[0].student_id_number).toBe('STU-LIVE-001');
  });
});
