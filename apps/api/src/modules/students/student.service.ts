import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { hashPasswordSync } from '../../common/crypto';
import { ConflictError, NotFoundError, BadRequestError } from '../../common/errors';
import {
  StudentRegisterInput,
  StudentCsvRow,
} from '@keydso/validation';
import {
  Student,
  StudentImportResult,
  StudentImportRowError,
} from '@keydso/shared-types';

export interface StudentQueryFilters {
  faculty_id?: string;
  department_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export class StudentService {
  public async getStudents(filters: StudentQueryFilters) {
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, Math.min(100, filters.page_size || 20));

    if (db instanceof InMemoryDatabase) {
      let filtered = [...db.students];

      if (filters.faculty_id) {
        filtered = filtered.filter((s) => s.faculty_id === filters.faculty_id);
      }
      if (filters.department_id) {
        filtered = filtered.filter((s) => s.department_id === filters.department_id);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.full_name.toLowerCase().includes(q) ||
            s.student_id_number.toLowerCase().includes(q) ||
            (s.email && s.email.toLowerCase().includes(q))
        );
      }

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize).map((s) => {
        const fac = db.faculties.find((f) => f.id === s.faculty_id);
        const dept = db.departments.find((d) => d.id === s.department_id);
        const cls = db.classes.find((c) => c.id === s.class_id);
        return {
          ...s,
          faculty_name: fac?.name,
          department_name: dept?.name,
          class_name: cls?.name,
        };
      });

      return { items, total, page, pageSize };
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.faculty_id) {
      conditions.push(`s.faculty_id = $${idx++}`);
      params.push(filters.faculty_id);
    }
    if (filters.department_id) {
      conditions.push(`s.department_id = $${idx++}`);
      params.push(filters.department_id);
    }
    if (filters.search) {
      conditions.push(`(LOWER(s.full_name) LIKE $${idx} OR LOWER(s.student_id_number) LIKE $${idx} OR LOWER(s.email) LIKE $${idx})`);
      params.push(`%${filters.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) FROM students s ${whereClause}`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    params.push(limit, offset);

    const itemsRes = await db.query(
      `SELECT s.*, f.name AS faculty_name, d.name AS department_name, c.name AS class_name
       FROM students s
       LEFT JOIN faculties f ON f.id = s.faculty_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN classes c ON c.id = s.class_id
       ${whereClause}
       ORDER BY s.student_id_number ASC
       LIMIT $${idx++} OFFSET $${idx++}`,
      params
    );

    return { items: itemsRes.rows, total, page, pageSize };
  }

  public async getStudentById(id: string): Promise<Student> {
    if (db instanceof InMemoryDatabase) {
      const s = db.students.find((stu) => stu.id === id);
      if (!s) throw new NotFoundError('Student not found');
      const fac = db.faculties.find((f) => f.id === s.faculty_id);
      const dept = db.departments.find((d) => d.id === s.department_id);
      const cls = db.classes.find((c) => c.id === s.class_id);
      return { ...s, faculty_name: fac?.name, department_name: dept?.name, class_name: cls?.name };
    }

    const res = await db.query(
      `SELECT s.*, f.name AS faculty_name, d.name AS department_name, c.name AS class_name
       FROM students s
       LEFT JOIN faculties f ON f.id = s.faculty_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1`,
      [id]
    );
    if (res.rowCount === 0) throw new NotFoundError('Student not found');
    return res.rows[0];
  }

  public async registerStudent(input: StudentRegisterInput, actorId: string): Promise<Student> {
    if (db instanceof InMemoryDatabase) {
      const dup = db.students.some((s) => s.student_id_number.toUpperCase() === input.student_id_number.toUpperCase());
      if (dup) throw new ConflictError(`Student with ID '${input.student_id_number}' already registered`);

      const stu: Student = {
        id: crypto.randomUUID(),
        ...input,
        student_id_number: input.student_id_number.toUpperCase(),
        enrollment_status: 'ACTIVE',
        registration_date: input.registration_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.students.push(stu);

      await recordAudit({
        actor_id: actorId,
        action: 'REGISTER_STUDENT',
        entity_type: 'STUDENT',
        entity_id: stu.id,
        new_state: stu as unknown as Record<string, unknown>,
      });
      return stu;
    }

    const res = await db.query(
      `INSERT INTO students (student_id_number, full_name, faculty_id, department_id, class_id, academic_year_id, contact_number, email, registration_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        input.student_id_number.toUpperCase(),
        input.full_name,
        input.faculty_id,
        input.department_id,
        input.class_id,
        input.academic_year_id,
        input.contact_number || null,
        input.email || null,
        input.registration_date || new Date().toISOString().split('T')[0],
      ]
    );
    const stu = res.rows[0];
    await recordAudit({
      actor_id: actorId,
      action: 'REGISTER_STUDENT',
      entity_type: 'STUDENT',
      entity_id: stu.id,
      new_state: stu,
    });
    return stu;
  }

  public async bulkImportStudents(
    records: StudentCsvRow[],
    academicYearId: string,
    isDryRun: boolean,
    actorId: string
  ): Promise<StudentImportResult> {
    const errors: StudentImportRowError[] = [];
    const seenIdsInBatch = new Set<string>();
    const validRowsToInsert: any[] = [];
    let existingCount = 0;

    // Preload academic entities for lookup
    let faculties: any[] = [];
    let departments: any[] = [];
    let classes: any[] = [];
    let existingStudentIds = new Set<string>();

    if (db instanceof InMemoryDatabase) {
      faculties = db.faculties;
      departments = db.departments;
      classes = db.classes;
      db.students.forEach((s) => existingStudentIds.add(s.student_id_number.toUpperCase()));
    } else {
      const fRes = await db.query('SELECT * FROM faculties');
      faculties = fRes.rows;
      const dRes = await db.query('SELECT * FROM departments');
      departments = dRes.rows;
      const cRes = await db.query('SELECT * FROM classes WHERE academic_year_id = $1', [academicYearId]);
      classes = cRes.rows;
      const sRes = await db.query('SELECT student_id_number FROM students');
      sRes.rows.forEach((r) => existingStudentIds.add(r.student_id_number.toUpperCase()));
    }

    // Row-by-row validation
    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 1;
      const row = records[i];

      const normId = row.student_id_number.trim().toUpperCase();

      // Check duplicate within batch
      if (seenIdsInBatch.has(normId)) {
        errors.push({
          row: rowNum,
          student_id_number: normId,
          field: 'student_id_number',
          error: `Duplicate student ID '${normId}' in import batch`,
        });
        continue;
      }
      seenIdsInBatch.add(normId);

      // Check if existing in database (will be updated / refreshed rather than rejected)
      if (existingStudentIds.has(normId)) {
        existingCount++;
      }

      // Lookup faculty by code, with safe fallback to first faculty
      const rawFacultyCode = (row.faculty_code || '').trim().toUpperCase();
      let faculty = faculties.find((f) => f.code.toUpperCase() === rawFacultyCode);
      if (!faculty && rawFacultyCode) {
        errors.push({
          row: rowNum,
          student_id_number: normId,
          field: 'faculty_code',
          error: `Faculty code '${row.faculty_code}' not recognized`,
        });
        continue;
      }
      if (!faculty) faculty = faculties[0];

      // Lookup department by code under that faculty, with safe fallback
      const rawDeptCode = (row.department_code || '').trim().toUpperCase();
      let department = departments.find(
        (d) => d.faculty_id === faculty.id && d.code.toUpperCase() === rawDeptCode
      );
      if (!department && rawDeptCode) {
        errors.push({
          row: rowNum,
          student_id_number: normId,
          field: 'department_code',
          error: `Department '${row.department_code}' not found under faculty '${row.faculty_code}'`,
        });
        continue;
      }
      if (!department) department = departments.find((d) => d.faculty_id === faculty.id) || departments[0];

      // Lookup or auto-match class cohort
      const rawClassName = (row.class_name || 'Class of 2026').trim();
      let classCohort = classes.find(
        (c) => c.department_id === department.id && c.name.toLowerCase() === rawClassName.toLowerCase()
      );
      if (!classCohort) {
        // Create class cohort dynamically if it doesn't exist
        if (!isDryRun) {
          if (db instanceof InMemoryDatabase) {
            classCohort = {
              id: crypto.randomUUID(),
              department_id: department.id,
              academic_year_id: academicYearId,
              name: rawClassName,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            db.classes.push(classCohort);
            classes.push(classCohort);
          } else {
            const newClassRes = await db.query(
              `INSERT INTO classes (department_id, academic_year_id, name)
               VALUES ($1, $2, $3) RETURNING *`,
              [department.id, academicYearId, rawClassName]
            );
            classCohort = newClassRes.rows[0];
            classes.push(classCohort);
          }
        }
      }

      validRowsToInsert.push({
        id: crypto.randomUUID(),
        student_id_number: normId,
        full_name: row.full_name.trim(),
        faculty_id: faculty.id,
        department_id: department.id,
        class_id: classCohort ? classCohort.id : 'pending-cohort',
        academic_year_id: academicYearId,
        contact_number: row.contact_number?.trim() || null,
        email: row.email?.trim() || null,
        registration_date: row.registration_date?.trim() || new Date().toISOString().split('T')[0],
      });
    }

    // If dry run, return summary without persisting
    if (isDryRun) {
      return {
        total_rows: records.length,
        valid_rows: validRowsToInsert.length,
        imported_count: 0,
        duplicate_count: existingCount,
        error_count: errors.length,
        errors,
        is_dry_run: true,
      };
    }

    // Live run: If errors exist, abort transaction safely
    if (errors.length > 0) {
      return {
        total_rows: records.length,
        valid_rows: validRowsToInsert.length,
        imported_count: 0,
        duplicate_count: existingCount,
        error_count: errors.length,
        errors,
        is_dry_run: false,
      };
    }

    // Insert valid records
    if (db instanceof InMemoryDatabase) {
      for (const row of validRowsToInsert) {
        db.students.push({
          ...row,
          enrollment_status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } else {
      await db.withTransaction(async (txClient) => {
        const roleRes = await txClient.query("SELECT id FROM roles WHERE name = 'STUDENT'");
        const studentRoleId = roleRes.rows[0]?.id;

        for (const row of validRowsToInsert) {
          await txClient.query(
            `INSERT INTO students (id, student_id_number, full_name, faculty_id, department_id, class_id, academic_year_id, contact_number, email, registration_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (student_id_number) DO UPDATE
             SET full_name = EXCLUDED.full_name, email = EXCLUDED.email`,
            [
              row.id,
              row.student_id_number,
              row.full_name,
              row.faculty_id,
              row.department_id,
              row.class_id,
              row.academic_year_id,
              row.contact_number,
              row.email,
              row.registration_date,
            ]
          );

          // Automatically create user profile with password set to student_id_number
          const studentEmail = row.email || `${row.student_id_number.toLowerCase()}@student.university.edu`;
          const passHash = hashPasswordSync(row.student_id_number);

          const profRes = await txClient.query(
            `INSERT INTO profiles (email, password_hash, full_name, contact_number, is_active, student_id)
             VALUES ($1, $2, $3, $4, true, $5)
             ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash,
                 full_name = EXCLUDED.full_name,
                 student_id = EXCLUDED.student_id,
                 is_active = true
             RETURNING id`,
            [studentEmail, passHash, row.full_name, row.contact_number || '+252 61 5000000', row.id]
          );
          const profileId = profRes.rows[0]?.id;

          if (profileId && studentRoleId) {
            await txClient.query(
              `INSERT INTO user_role_assignments (user_id, role_id)
               VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [profileId, studentRoleId]
            );
          }

          // Assign default semester contribution obligation
          await txClient.query(
            `INSERT INTO contribution_obligations (
              student_id, campaign_id, expected_amount, verified_paid_amount, waived_amount, sponsored_amount, status
            ) VALUES ($1, '70000000-0000-0000-0000-000000000001', 25.00, 0.00, 0.00, 0.00, 'DUE')
            ON CONFLICT (student_id, campaign_id) DO NOTHING`,
            [row.id]
          );
        }
      });
    }

    await recordAudit({
      actor_id: actorId,
      action: 'BULK_IMPORT_STUDENTS',
      entity_type: 'STUDENT',
      entity_id: `batch-${Date.now()}`,
      new_state: { count: validRowsToInsert.length },
    });

    return {
      total_rows: records.length,
      valid_rows: validRowsToInsert.length,
      imported_count: validRowsToInsert.length,
      duplicate_count: existingCount,
      error_count: 0,
      errors: [],
      is_dry_run: false,
    };
  }
}

export const studentService = new StudentService();
