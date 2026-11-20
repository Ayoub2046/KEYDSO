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
  public evidenceFiles: any[] = [];
  public supportCases: any[] = [];
  public issueReports: any[] = [];
  public announcements: any[] = [];

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

    // Seed Admin Password Hash
    const adminPasswordHash = await hashPassword('AdminPass123!');
    const studentPasswordHash = await hashPassword('StudentPass123!');

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

    // Seed General President Profile
    const genPresUser = {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'president@keydso.university.edu',
      password_hash: adminPasswordHash,
      full_name: 'Mohamud Jama Duale',
      contact_number: '+252 61 7000001',
      bio: 'General President of the Student Representative Council. Office: Council House Room 10.',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Seed Faculty of Computing President Profile
    const csitRepUser = {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'csit.rep@keydso.university.edu',
      password_hash: adminPasswordHash,
      full_name: 'Hafsa Mohamed Ali',
      contact_number: '+252 61 7000005',
      bio: 'Faculty President, Computing & IT. IT Complex Room 102. Available Mon-Thu 1pm-3pm.',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Seed Faculty of Engineering President Profile
    const engRepUser = {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'eng.rep@keydso.university.edu',
      password_hash: adminPasswordHash,
      full_name: 'Eng. Khalid Abdi Farah',
      contact_number: '+252 61 7000004',
      bio: 'Faculty President, Engineering. Engineering Building Room 204. Available via WhatsApp.',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Seed Student User with linked student_id
    const demoStudentUser = {
      id: '00000000-0000-0000-0000-000000000099',
      email: 'student.demo@keydso.university.edu',
      password_hash: studentPasswordHash,
      full_name: 'Safia Abdirahman Hassan',
      contact_number: '+252 61 8999999',
      student_id: '90000000-0000-0000-0000-000000000001',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.profiles = [adminUser, genPresUser, csitRepUser, engRepUser, demoStudentUser];

    this.userRoleAssignments = [
      { id: '01000000-0000-0000-0000-000000000001', user_id: adminUser.id, role_id: '10000000-0000-0000-0000-000000000001', assigned_at: new Date().toISOString() },
      { id: '01000000-0000-0000-0000-000000000002', user_id: genPresUser.id, role_id: '10000000-0000-0000-0000-000000000002', assigned_at: new Date().toISOString() },
      { id: '01000000-0000-0000-0000-000000000004', user_id: engRepUser.id, role_id: '10000000-0000-0000-0000-000000000004', assigned_at: new Date().toISOString() },
      { id: '01000000-0000-0000-0000-000000000005', user_id: csitRepUser.id, role_id: '10000000-0000-0000-0000-000000000004', assigned_at: new Date().toISOString() },
      { id: '01000000-0000-0000-0000-000000000099', user_id: demoStudentUser.id, role_id: '10000000-0000-0000-0000-000000000009', assigned_at: new Date().toISOString() },
    ];

    // Seed Academic Year & Semesters
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

    // Seed Faculties
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

    // Seed Faculty Assignments
    this.facultyAssignments = [
      { id: '02000000-0000-0000-0000-000000000001', user_id: engRepUser.id, faculty_id: facEng.id, academic_year_id: ay.id, role_title: 'Faculty President', is_active: true, assigned_at: new Date().toISOString() },
      { id: '02000000-0000-0000-0000-000000000002', user_id: csitRepUser.id, faculty_id: facCsit.id, academic_year_id: ay.id, role_title: 'Faculty President', is_active: true, assigned_at: new Date().toISOString() },
    ];

    // Seed Departments
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

    // Seed Classes
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

    // Seed Demo Student Record
    const demoStudent = {
      id: '90000000-0000-0000-0000-000000000001',
      student_id_number: 'STU-2024-001',
      full_name: 'Safia Abdirahman Hassan',
      faculty_id: facCsit.id,
      department_id: deptCs.id,
      class_id: classCs3.id,
      academic_year_id: ay.id,
      contact_number: '+252 61 8999999',
      email: 'student.demo@keydso.university.edu',
      enrollment_status: 'ACTIVE',
      registration_date: '2024-09-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.students = [demoStudent];

    // Seed Core Fund
    const genFund = {
      id: '60000000-0000-0000-0000-000000000001',
      code: 'GEN-FUND',
      name: 'General Student Council Fund',
      description: 'Primary treasury',
      current_balance: 1450.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.funds = [genFund];

    // Seed Contribution Campaign
    const campaign = {
      id: '70000000-0000-0000-0000-000000000001',
      title: 'Semester 2 Campus Transparency & Welfare Drive',
      code: 'CAMP-2026-S2',
      description: 'Campus WiFi enhancement, student council governance, and emergency welfare aid.',
      purpose: 'Infrastructure upgrade & student welfare support',
      target_amount: 5000.0,
      contribution_amount: 25.0,
      campaign_type: 'FIXED_PER_STUDENT',
      scope_type: 'UNIVERSITY_WIDE',
      fund_id: genFund.id,
      academic_year_id: ay.id,
      semester_id: s2.id,
      start_date: '2026-02-01',
      end_date: '2026-05-30',
      responsible_officer_id: adminUser.id,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.campaigns = [campaign];

    // Seed Contribution Obligation for demo student
    const obligation = {
      id: '80000000-0000-0000-0000-000000000001',
      student_id: demoStudent.id,
      campaign_id: campaign.id,
      expected_amount: 25.0,
      verified_paid_amount: 25.0,
      waived_amount: 0.0,
      sponsored_amount: 0.0,
      status: 'PAID',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.obligations = [obligation];

    // Seed Verified Payment & Receipt
    const payment = {
      id: '91000000-0000-0000-0000-000000000001',
      transaction_reference: 'EVC-PLUS-252618999999-TX101',
      idempotency_key: 'idemp-tx-101',
      student_id: demoStudent.id,
      campaign_id: campaign.id,
      amount: 25.0,
      payment_method: 'MOBILE_MONEY',
      payment_date: '2026-02-05',
      receipt_number: 'REC-2026-0001',
      status: 'VERIFIED',
      recorded_by: adminUser.id,
      verified_by: adminUser.id,
      verification_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.payments = [payment];

    const receipt = {
      id: '92000000-0000-0000-0000-000000000001',
      payment_id: payment.id,
      receipt_number: 'REC-2026-0001',
      student_name: demoStudent.full_name,
      student_id_number: demoStudent.student_id_number,
      amount: 25.0,
      campaign_title: campaign.title,
      issued_at: new Date().toISOString(),
      issued_by: adminUser.id,
      signature_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    };
    this.receipts = [receipt];

    // Seed Sample Public Expense (Transparency Feed)
    const expense = {
      id: '93000000-0000-0000-0000-000000000001',
      title: 'IT Lab Network Switches & High-Speed Patch Cables',
      purpose: 'Replacement of faulty 24-port Gigabit switches in Central Computing Lab B',
      description: 'Procured from TechZone Supplies under PO-2026-042',
      campaign_id: campaign.id,
      fund_id: genFund.id,
      requested_amount: 320.0,
      approved_amount: 320.0,
      vendor_name: 'TechZone University Supplies Ltd',
      vendor_contact: '+252 61 5554321',
      requesting_officer_id: csitRepUser.id,
      approved_by_president_id: genPresUser.id,
      status: 'RECONCILED',
      disbursed_at: '2026-02-10T10:00:00Z',
      is_public_summary_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.expenses = [expense];

    this.evidenceFiles = [
      {
        id: '94000000-0000-0000-0000-000000000001',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        file_name: 'Vendor_Invoice_TechZone_INV882.pdf',
        file_path: 'expenses/invoices/INV882.pdf',
        file_size_bytes: 425600,
        mime_type: 'application/pdf',
        is_public_evidence: true,
        uploaded_by: adminUser.id,
        created_at: new Date().toISOString(),
      },
    ];

    // Seed Announcements
    this.announcements = [
      {
        id: '70000000-0000-0000-0000-000000000001',
        title: 'Welcome to Keydso Maanta — Student Council Transparency Portal',
        content: 'The Student Representative Council is proud to launch Keydso Maanta. Every student can now track contribution campaigns, inspect expenditures, and connect directly with their faculty representatives.',
        category: 'GENERAL',
        target_audience: 'ALL',
        author_name: 'Council Secretariat',
        published_at: new Date().toISOString(),
      },
      {
        id: '70000000-0000-0000-0000-000000000002',
        title: 'Semester 2 Contribution Campaign Active',
        content: 'The Semester 2 Campus Improvement and Student Support Campaign has been officially ratified. Receipts will be issued digitally upon verified payment.',
        category: 'FINANCE',
        target_audience: 'ALL',
        author_name: 'Finance Committee',
        published_at: new Date().toISOString(),
      },
    ];
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
