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
  student_id?: string | null;
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
  code: string;
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

export interface ContributionCampaign {
  id: string;
  title: string;
  code: string;
  description: string;
  purpose: string;
  target_amount: number;
  contribution_amount: number;
  campaign_type: CampaignType;
  scope_type: 'UNIVERSITY_WIDE' | 'FACULTY' | 'DEPARTMENT' | 'CLASS' | 'CUSTOM';
  fund_id: string;
  fund_name?: string;
  academic_year_id: string;
  semester_id: string;
  start_date: string;
  end_date: string;
  eligible_faculty_ids?: string[];
  eligible_department_ids?: string[];
  responsible_officer_id: string;
  status: CampaignStatus;
  obligations_count?: number;
  total_expected?: number;
  total_collected?: number;
  collection_rate_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Fund {
  id: string;
  code: string;
  name: string;
  description?: string;
  current_balance: number;
  total_credits?: number;
  total_debits?: number;
  ledger_entry_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  campaign_id: string;
  campaign_title?: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  transaction_reference: string;
  idempotency_key: string;
  receipt_number?: string | null;
  status: PaymentStatus;
  notes?: string | null;
  recorded_by: string;
  recorded_by_name?: string;
  verified_by?: string | null;
  verification_date?: string | null;
  verification_note?: string | null;
  reversal_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  purpose: string;
  description?: string;
  campaign_id: string;
  campaign_title?: string;
  fund_id: string;
  fund_name?: string;
  requested_amount: number;
  approved_amount?: number;
  vendor_name: string;
  vendor_contact?: string;
  requesting_officer_id: string;
  requesting_officer_name?: string;
  approved_by_president_id?: string;
  approver_name?: string;
  status: ExpenseStatus;
  disbursed_at?: string;
  is_public_summary_published: boolean;
  evidence_files?: {
    id: string;
    file_name: string;
    file_path: string;
    file_size_bytes: number;
    mime_type: string;
    is_public_evidence: boolean;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  fund_id: string;
  fund_name?: string;
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance_after: number;
  reference_type: string;
  reference_id: string;
  description: string;
  created_by: string;
  creator_name?: string;
  created_at: string;
}

export interface WelfareCase {
  id: string;
  case_number: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  confidential_reason: string;
  requested_amount: number;
  approved_amount: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  welfare_reviewer_id?: string;
  reviewer_name?: string;
  created_at: string;
  updated_at: string;
}

// --- Student Portal Domain Types ---
export interface RepresentativeInfo {
  id: string;
  full_name: string;
  role_title: string;
  faculty_name?: string;
  department_name?: string;
  contact_number?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  whatsapp_number?: string | null;
  office_hours?: string | null;
}

export interface StudentPaymentRecord {
  id: string;
  transaction_reference: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentStatus;
  receipt_number?: string | null;
  campaign_title: string;
  verification_date?: string | null;
}

export interface StudentReceipt {
  id: string;
  payment_id: string;
  receipt_number: string;
  student_name: string;
  student_id_number: string;
  amount: number;
  campaign_title: string;
  payment_method: string;
  issued_at: string;
  issued_by_name: string;
  signature_hash: string;
}

export interface StudentCampaignSummary {
  campaign_id: string;
  campaign_title: string;
  campaign_purpose: string;
  campaign_type: CampaignType;
  expected_amount: number;
  verified_paid_amount: number;
  waived_amount: number;
  sponsored_amount: number;
  remaining_balance: number;
  status: ObligationStatus;
  due_date: string;
  payments: StudentPaymentRecord[];
}

export interface StudentPortalOverview {
  student: Student;
  total_expected: number;
  total_paid: number;
  total_remaining: number;
  overall_status: ObligationStatus;
  campaigns: StudentCampaignSummary[];
  recent_receipts: StudentReceipt[];
  representatives: RepresentativeInfo[];
  announcements: Announcement[];
}

export interface PublicExpenseSummary {
  id: string;
  campaign_title: string;
  expense_title: string;
  purpose: string;
  vendor_name: string;
  amount: number;
  disbursed_at: string;
  approver_name: string;
  evidence_files: {
    file_name: string;
    file_path: string;
    mime_type: string;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'FINANCE' | 'MEETING' | 'TRAINING' | 'WELFARE';
  target_audience: 'ALL' | 'FACULTY' | 'COUNCIL';
  author_name: string;
  published_at: string;
}

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
