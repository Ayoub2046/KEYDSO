import { Pool, QueryResult, QueryResultRow } from 'pg';
import crypto from 'crypto';
import { config } from '../common/config';
import { logger } from '../common/logger';
import { hashPassword } from '../common/crypto';
import { RoleName } from '@keydso/shared-types';

export interface IDatabaseClient {
  query<R extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<R>>;
  withTransaction<T>(callback: (client: IDatabaseClient) => Promise<T>): Promise<T>;
}

// In-Memory Database Store for Test / Local Environments without live Postgres
export class InMemoryDatabase implements IDatabaseClient {
  public academicYears: any[] = [];
  public semesters: any[] = [];
  public faculties: any[] = [];
  public departments: any[] = [];
  public classes: any[] = [];
  public students: any[] = [];
  public profiles: any[] = [];
  public roles: any[] = [];
  public permissions: any[] = [];
  public rolePermissions: any[] = [];
  public userRoleAssignments: any[] = [];
  public facultyAssignments: any[] = [];
  public auditLogs: any[] = [];
  public funds: any[] = [];
  public campaigns: any[] = [];
  public obligations: any[] = [];
  public payments: any[] = [];
  public ledgerEntries: any[] = [];
  public receipts: any[] = [];
  public expenses: any[] = [];
  public supportCases: any[] = [];
  public issueReports: any[] = [];

  constructor() {
    this.seedDefaultData();
  }

  public async seedDefaultData() {
    // Seed system roles with valid UUIDs
    const systemRoles = [
      { id: '10000000-0000-0000-0000-000000000001', name: RoleName.SYSTEM_ADMIN, description: 'System Administrator' },
      { id: '10000000-0000-0000-0000-000000000002', name: RoleName.GENERAL_PRESIDENT, description: 'General President' },
      { id: '10000000-0000-0000-0000-000000000003', name: RoleName.VICE_PRESIDENT, description: 'Vice President' },
      { id: '10000000-0000-0000-0000-000000000004', name: RoleName.FACULTY_PRESIDENT, description: 'Faculty President' },
      { id: '10000000-0000-0000-0000-000000000005', name: RoleName.FINANCE_OFFICER, description: 'Finance Officer' },
      { id: '10000000-0000-0000-0000-000000000006', name: RoleName.SECRETARY, description: 'Council Secretary' },
      { id: '10000000-0000-0000-0000-000000000007', name: RoleName.COMMITTEE_CHAIR, description: 'Committee Chairperson' },
      { id: '10000000-0000-0000-0000-000000000008', name: RoleName.COMMITTEE_MEMBER, description: 'Committee Member' },
      { id: '10000000-0000-0000-0000-000000000009', name: RoleName.STUDENT, description: 'University Student' },
    ];
    this.roles = systemRoles;

    // Seed default admin with valid UUID
    const adminPasswordHash = await hashPassword('AdminPass123!');
    const adminUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@keydso.university.edu',
      password_hash: adminPasswordHash,
      full_name: 'Council System Administrator',
      contact_number: '+252 61 5000000',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles = [adminUser];
    this.userRoleAssignments = [
      {
        id: '01000000-0000-0000-0000-000000000001',
        user_id: adminUser.id,
        role_id: '10000000-0000-0000-0000-000000000001',
        assigned_at: new Date().toISOString(),
      },
    ];

    // Seed default Academic Year with valid UUID
    const ay = {
      id: '20000000-0000-0000-0000-000000000001',
      code: 'AY-2025-2026',
      name: 'Academic Year 2025/2026',
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      is_current: true,
      is_archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.academicYears = [ay];

    // Seed default Semesters with valid UUID
    const s1 = {
      id: '21000000-0000-0000-0000-000000000001',
      academic_year_id: ay.id,
      code: 'S1-2025',
      name: 'Semester 1',
      start_date: '2025-09-01',
      end_date: '2026-01-31',
      is_current: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const s2 = {
      id: '21000000-0000-0000-0000-000000000002',
      academic_year_id: ay.id,
      code: 'S2-2026',
      name: 'Semester 2',
      start_date: '2026-02-01',
      end_date: '2026-06-30',
      is_current: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.semesters = [s1, s2];

    // Seed default Faculties with valid UUID
    const facEng = {
      id: '30000000-0000-0000-0000-000000000001',
      code: 'ENG',
      name: 'Faculty of Engineering',
      description: 'Engineering programs',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const facCsit = {
      id: '30000000-0000-0000-0000-000000000002',
      code: 'CSIT',
      name: 'Faculty of Computing & IT',
      description: 'Computing & Software',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const facBus = {
      id: '30000000-0000-0000-0000-000000000003',
      code: 'FBE',
      name: 'Faculty of Business & Economics',
      description: 'Business administration',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.faculties = [facEng, facCsit, facBus];

    // Seed default Departments with valid UUID
    const deptCs = {
      id: '40000000-0000-0000-0000-000000000001',
      faculty_id: facCsit.id,
      code: 'CS',
      name: 'Computer Science',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const deptSe = {
      id: '40000000-0000-0000-0000-000000000002',
      faculty_id: facCsit.id,
      code: 'SE',
      name: 'Software Engineering',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const deptCivil = {
      id: '40000000-0000-0000-0000-000000000003',
      faculty_id: facEng.id,
      code: 'CIVIL',
      name: 'Civil Engineering',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.departments = [deptCs, deptSe, deptCivil];

    // Seed Classes with valid UUID
    const classCs3 = {
      id: '50000000-0000-0000-0000-000000000001',
      department_id: deptCs.id,
      academic_year_id: ay.id,
      name: 'CS Class of 2026 (Year 3)',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.classes = [classCs3];

    // Seed Core Fund with valid UUID
    const genFund = {
      id: '60000000-0000-0000-0000-000000000001',
      code: 'GEN-FUND',
      name: 'General Student Council Fund',
      description: 'Primary treasury',
      current_balance: 0.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.funds = [genFund];
  }

  public async query<R extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<R>> {
    return {
      rows: [] as R[],
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      fields: [],
    };
  }

  public async withTransaction<T>(callback: (client: IDatabaseClient) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

// PostgreSQL Real Client Adapter
class PostgresDatabase implements IDatabaseClient {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
    });
  }

  public async query<R extends QueryResultRow = any>(text: string, params: any[] = []): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }

  public async withTransaction<T>(callback: (client: IDatabaseClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const transactionWrapper: IDatabaseClient = {
        query: (t, p) => client.query(t, p),
        withTransaction: (cb) => cb(transactionWrapper),
      };
      const result = await callback(transactionWrapper);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Initialize singleton DB instance
export const db: InMemoryDatabase | PostgresDatabase =
  config.databaseUrl && !config.isTest
    ? new PostgresDatabase(config.databaseUrl)
    : new InMemoryDatabase();
