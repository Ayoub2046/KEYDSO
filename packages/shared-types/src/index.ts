// ============================================================================
// KEYDSO MAANTA — Shared Core Types & Enums
// ============================================================================

// --- Roles & Identity ---
export enum RoleName {
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  GENERAL_PRESIDENT = 'GENERAL_PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  FACULTY_PRESIDENT = 'FACULTY_PRESIDENT',
  FINANCE_OFFICER = 'FINANCE_OFFICER',
  SECRETARY = 'SECRETARY',
  COMMITTEE_CHAIR = 'COMMITTEE_CHAIR',
  COMMITTEE_MEMBER = 'COMMITTEE_MEMBER',
  STUDENT = 'STUDENT',
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  contact_number?: string | null;
  bio?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  role_name: RoleName;
  assigned_by?: string | null;
  assigned_at: string;
}

export interface FacultyAssignment {
  id: string;
  user_id: string;
  faculty_id: string;
  faculty_name?: string;
  academic_year_id: string;
  role_title: string;
  is_active: boolean;
  assigned_at: string;
}

export interface AuthSession {
  user: UserProfile;
  roles: RoleName[];
  assigned_faculty_id?: string | null;
  assigned_committee_ids?: string[];
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// --- Academic Hierarchy ---
export interface AcademicYear {
  id: string;
  code: string; // e.g. "AY-2025-2026"
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  department_count?: number;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  faculty_id: string;
  code: string;
  name: string;
  is_active: boolean;
  faculty_name?: string;
  student_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ClassCohort {
  id: string;
  department_id: string;
  academic_year_id: string;
  name: string;
  is_active: boolean;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

// --- Student Directory ---
export type EnrollmentStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN' | 'GRADUATED' | 'INACTIVE';

export interface Student {
  id: string;
  student_id_number: string;
  full_name: string;
  faculty_id: string;
  department_id: string;
  class_id: string;
  academic_year_id: string;
  contact_number?: string | null;
  email?: string | null;
  enrollment_status: EnrollmentStatus;
  registration_date: string;
  faculty_name?: string;
  department_name?: string;
  class_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentImportRecord {
  student_id_number: string;
  full_name: string;
  faculty_code: string;
  department_code: string;
  class_name: string;
  contact_number?: string;
  email?: string;
  registration_date?: string;
}

export interface StudentImportRowError {
  row: number;
  student_id_number?: string;
  field: string;
  error: string;
}

export interface StudentImportResult {
  total_rows: number;
  valid_rows: number;
  imported_count: number;
  duplicate_count: number;
  error_count: number;
  errors: StudentImportRowError[];
  is_dry_run: boolean;
}

// --- Financial Core ---
export type CampaignType =
  | 'FIXED_PER_STUDENT'
  | 'FACULTY_SPECIFIC'
  | 'DEPARTMENT_SPECIFIC'
  | 'CLASS_SPECIFIC'
  | 'VOLUNTARY'
  | 'EMERGENCY'
  | 'WELFARE'
  | 'EVENT';

export type CampaignStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';

export type ObligationStatus =
  | 'NOT_DUE'
  | 'DUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'WAIVED'
  | 'SPONSORED'
  | 'DISPUTED'
  | 'OVERDUE';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'REVERSED';

export type ExpenseStatus =
  | 'REQUESTED'
  | 'FINANCE_REVIEWED'
  | 'APPROVED'
  | 'DISBURSED'
  | 'RECONCILED'
  | 'REJECTED';

// --- Audit & Security ---
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  previous_state?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
}

// --- API Standard Wrappers ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
