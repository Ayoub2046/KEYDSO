import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { ConflictError, NotFoundError } from '../../common/errors';
import {
  AcademicYearInput,
  SemesterInput,
  FacultyInput,
  DepartmentInput,
  ClassCohortInput,
} from '@keydso/validation';

export class AcademicService {
  // --- Academic Years ---
  public async getAcademicYears() {
    if (db instanceof InMemoryDatabase) {
      return [...db.academicYears];
    }
    const res = await db.query('SELECT * FROM academic_years ORDER BY start_date DESC');
    return res.rows;
  }

  public async createAcademicYear(input: AcademicYearInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const exists = db.academicYears.some((ay) => ay.code.toUpperCase() === input.code.toUpperCase());
      if (exists) throw new ConflictError(`Academic year with code '${input.code}' already exists`);

      const ay = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (ay.is_current) {
        db.academicYears.forEach((item) => (item.is_current = false));
      }
      db.academicYears.push(ay);
      await recordAudit({ actor_id: actorId, action: 'CREATE_ACADEMIC_YEAR', entity_type: 'ACADEMIC_YEAR', entity_id: ay.id, new_state: ay });
      return ay;
    }

    const res = await db.query(
      `INSERT INTO academic_years (code, name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.code.toUpperCase(), input.name, input.start_date, input.end_date, input.is_current]
    );
    const ay = res.rows[0];
    await recordAudit({ actor_id: actorId, action: 'CREATE_ACADEMIC_YEAR', entity_type: 'ACADEMIC_YEAR', entity_id: ay.id, new_state: ay });
    return ay;
  }

  // --- Semesters ---
  public async getSemesters(academicYearId?: string) {
    if (db instanceof InMemoryDatabase) {
      return academicYearId
        ? db.semesters.filter((s) => s.academic_year_id === academicYearId)
        : [...db.semesters];
    }
    const query = academicYearId
      ? 'SELECT * FROM semesters WHERE academic_year_id = $1 ORDER BY start_date ASC'
      : 'SELECT * FROM semesters ORDER BY start_date ASC';
    const params = academicYearId ? [academicYearId] : [];
    const res = await db.query(query, params);
    return res.rows;
  }

  public async createSemester(input: SemesterInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const exists = db.semesters.some(
        (s) => s.academic_year_id === input.academic_year_id && s.code.toUpperCase() === input.code.toUpperCase()
      );
      if (exists) throw new ConflictError(`Semester code '${input.code}' already exists in this academic year`);

      const sem = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (sem.is_current) {
        db.semesters.forEach((s) => (s.is_current = false));
      }
      db.semesters.push(sem);
      await recordAudit({ actor_id: actorId, action: 'CREATE_SEMESTER', entity_type: 'SEMESTER', entity_id: sem.id, new_state: sem });
      return sem;
    }

    const res = await db.query(
      `INSERT INTO semesters (academic_year_id, code, name, start_date, end_date, is_current)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [input.academic_year_id, input.code.toUpperCase(), input.name, input.start_date, input.end_date, input.is_current]
    );
    const sem = res.rows[0];
    await recordAudit({ actor_id: actorId, action: 'CREATE_SEMESTER', entity_type: 'SEMESTER', entity_id: sem.id, new_state: sem });
    return sem;
  }

  // --- Faculties ---
  public async getFaculties() {
    if (db instanceof InMemoryDatabase) {
      return db.faculties.map((f) => {
        const depts = db.departments.filter((d) => d.faculty_id === f.id);
        const studs = db.students.filter((s) => s.faculty_id === f.id);
        return { ...f, department_count: depts.length, student_count: studs.length };
      });
    }
    const res = await db.query(`
      SELECT f.*, 
        COUNT(DISTINCT d.id) AS department_count, 
        COUNT(DISTINCT s.id) AS student_count
      FROM faculties f
      LEFT JOIN departments d ON d.faculty_id = f.id
      LEFT JOIN students s ON s.faculty_id = f.id
      GROUP BY f.id
      ORDER BY f.name ASC
    `);
    return res.rows;
  }

  public async createFaculty(input: FacultyInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const exists = db.faculties.some((f) => f.code.toUpperCase() === input.code.toUpperCase());
      if (exists) throw new ConflictError(`Faculty with code '${input.code}' already exists`);

      const fac = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.faculties.push(fac);
      await recordAudit({ actor_id: actorId, action: 'CREATE_FACULTY', entity_type: 'FACULTY', entity_id: fac.id, new_state: fac });
      return fac;
    }

    const res = await db.query(
      `INSERT INTO faculties (code, name, description, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.code.toUpperCase(), input.name, input.description || null, input.is_active]
    );
    const fac = res.rows[0];
    await recordAudit({ actor_id: actorId, action: 'CREATE_FACULTY', entity_type: 'FACULTY', entity_id: fac.id, new_state: fac });
    return fac;
  }

  // --- Departments ---
  public async getDepartments(facultyId?: string) {
    if (db instanceof InMemoryDatabase) {
      let list = facultyId ? db.departments.filter((d) => d.faculty_id === facultyId) : [...db.departments];
      return list.map((d) => {
        const fac = db.faculties.find((f) => f.id === d.faculty_id);
        const studs = db.students.filter((s) => s.department_id === d.id);
        return { ...d, faculty_name: fac?.name, student_count: studs.length };
      });
    }
    const query = facultyId
      ? `SELECT d.*, f.name AS faculty_name, COUNT(s.id) AS student_count
         FROM departments d
         JOIN faculties f ON f.id = d.faculty_id
         LEFT JOIN students s ON s.department_id = d.id
         WHERE d.faculty_id = $1
         GROUP BY d.id, f.name
         ORDER BY d.name ASC`
      : `SELECT d.*, f.name AS faculty_name, COUNT(s.id) AS student_count
         FROM departments d
         JOIN faculties f ON f.id = d.faculty_id
         LEFT JOIN students s ON s.department_id = d.id
         GROUP BY d.id, f.name
         ORDER BY d.name ASC`;
    const params = facultyId ? [facultyId] : [];
    const res = await db.query(query, params);
    return res.rows;
  }

  public async createDepartment(input: DepartmentInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const fac = db.faculties.find((f) => f.id === input.faculty_id);
      if (!fac) throw new NotFoundError('Faculty not found');

      const exists = db.departments.some(
        (d) => d.faculty_id === input.faculty_id && d.code.toUpperCase() === input.code.toUpperCase()
      );
      if (exists) throw new ConflictError(`Department with code '${input.code}' already exists under this faculty`);

      const dept = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.departments.push(dept);
      await recordAudit({ actor_id: actorId, action: 'CREATE_DEPARTMENT', entity_type: 'DEPARTMENT', entity_id: dept.id, new_state: dept });
      return { ...dept, faculty_name: fac.name };
    }

    const res = await db.query(
      `INSERT INTO departments (faculty_id, code, name, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.faculty_id, input.code.toUpperCase(), input.name, input.is_active]
    );
    const dept = res.rows[0];
    await recordAudit({ actor_id: actorId, action: 'CREATE_DEPARTMENT', entity_type: 'DEPARTMENT', entity_id: dept.id, new_state: dept });
    return dept;
  }

  // --- Classes ---
  public async getClasses(departmentId?: string) {
    if (db instanceof InMemoryDatabase) {
      let list = departmentId ? db.classes.filter((c) => c.department_id === departmentId) : [...db.classes];
      return list.map((c) => {
        const d = db.departments.find((dep) => dep.id === c.department_id);
        return { ...c, department_name: d?.name };
      });
    }
    const query = departmentId
      ? `SELECT c.*, d.name AS department_name FROM classes c
         JOIN departments d ON d.id = c.department_id
         WHERE c.department_id = $1 ORDER BY c.name ASC`
      : `SELECT c.*, d.name AS department_name FROM classes c
         JOIN departments d ON d.id = c.department_id
         ORDER BY c.name ASC`;
    const params = departmentId ? [departmentId] : [];
    const res = await db.query(query, params);
    return res.rows;
  }

  public async createClass(input: ClassCohortInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const dept = db.departments.find((d) => d.id === input.department_id);
      if (!dept) throw new NotFoundError('Department not found');

      const cl = {
        id: crypto.randomUUID(),
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.classes.push(cl);
      await recordAudit({ actor_id: actorId, action: 'CREATE_CLASS', entity_type: 'CLASS', entity_id: cl.id, new_state: cl });
      return { ...cl, department_name: dept.name };
    }

    const res = await db.query(
      `INSERT INTO classes (department_id, academic_year_id, name, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [input.department_id, input.academic_year_id, input.name, input.is_active]
    );
    const cl = res.rows[0];
    await recordAudit({ actor_id: actorId, action: 'CREATE_CLASS', entity_type: 'CLASS', entity_id: cl.id, new_state: cl });
    return cl;
  }
}

export const academicService = new AcademicService();
