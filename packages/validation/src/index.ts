import { z } from 'zod';

// --- Authentication Schemas ---
export const LoginSchema = z.object({
  email: z.string().trim().min(3, 'Email address or Student ID is required'),
  password: z.string().min(4, 'Password must be at least 4 characters long'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const PasswordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(6, 'New password must be at least 6 characters'),
});
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;

// --- Academic Hierarchy Schemas ---
export const AcademicYearSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Code too short')
    .max(30, 'Code max 30 chars')
    .regex(/^[A-Za-z0-9\-_/]+$/, 'Code can only contain alphanumeric, dash, underscore, and slash'),
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  is_current: z.boolean().default(false),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be strictly after start date',
  path: ['end_date'],
});
export type AcademicYearInput = z.infer<typeof AcademicYearSchema>;

export const SemesterSchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  name: z.string().trim().min(2, 'Semester name required').max(50),
  code: z.string().trim().min(2).max(30),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  is_current: z.boolean().default(false),
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be strictly after start date',
  path: ['end_date'],
});
export type SemesterInput = z.infer<typeof SemesterSchema>;

export const FacultySchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Faculty code must be at least 2 chars')
    .max(20, 'Faculty code max 20 chars')
    .toUpperCase(),
  name: z.string().trim().min(3, 'Faculty name must be at least 3 characters').max(150),
  description: z.string().trim().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
});
export type FacultyInput = z.infer<typeof FacultySchema>;

export const DepartmentSchema = z.object({
  faculty_id: z.string().uuid('Invalid faculty UUID'),
  code: z
    .string()
    .trim()
    .min(2, 'Department code must be at least 2 chars')
    .max(20, 'Department code max 20 chars')
    .toUpperCase(),
  name: z.string().trim().min(3, 'Department name must be at least 3 characters').max(150),
  is_active: z.boolean().default(true),
});
export type DepartmentInput = z.infer<typeof DepartmentSchema>;

export const ClassCohortSchema = z.object({
  department_id: z.string().uuid('Invalid department UUID'),
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  name: z.string().trim().min(2, 'Class name must be at least 2 characters').max(100),
  is_active: z.boolean().default(true),
});
export type ClassCohortInput = z.infer<typeof ClassCohortSchema>;

// --- Student Registration & Bulk Import Schemas ---
export const StudentRegisterSchema = z.object({
  student_id_number: z
    .string()
    .trim()
    .min(3, 'Student ID number must be at least 3 characters')
    .max(50)
    .regex(/^[A-Za-z0-9\-_/]+$/, 'Student ID can only contain alphanumeric and - _ / characters'),
  full_name: z.string().trim().min(3, 'Full name must be at least 3 characters').max(150),
  faculty_id: z.string().uuid('Invalid faculty UUID'),
  department_id: z.string().uuid('Invalid department UUID'),
  class_id: z.string().uuid('Invalid class cohort UUID'),
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  contact_number: z
    .string()
    .trim()
    .regex(/^[+0-9\s\-()]+$/, 'Invalid phone number format')
    .optional()
    .nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
  registration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});
export type StudentRegisterInput = z.infer<typeof StudentRegisterSchema>;

export const StudentCsvRowSchema = z.object({
  student_id_number: z.string().trim().min(1, 'Student ID number is required'),
  full_name: z.string().trim().min(2, 'Full name is required'),
  faculty_code: z.string().trim().min(1, 'Faculty code is required'),
  department_code: z.string().trim().min(1, 'Department code is required'),
  class_name: z.string().trim().min(1, 'Class cohort name is required'),
  contact_number: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email format').optional().or(z.literal('')),
  registration_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
});
export type StudentCsvRow = z.infer<typeof StudentCsvRowSchema>;

// --- User Management & Role Assignment Schemas ---
export const AssignRoleSchema = z.object({
  user_id: z.string().uuid('Invalid user UUID'),
  role_id: z.string().uuid('Invalid role UUID'),
});

export const AssignFacultyRepSchema = z.object({
  user_id: z.string().uuid('Invalid user UUID'),
  faculty_id: z.string().uuid('Invalid faculty UUID'),
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  role_title: z.string().trim().min(2).max(100).default('Faculty President'),
});

// --- Student Portal & Feedback Schemas ---
export const StudentFeedbackSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  category: z.enum(['ACADEMIC', 'INFRASTRUCTURE', 'WELFARE', 'ADMINISTRATIVE', 'FINANCIAL', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000),
  faculty_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
});
export type StudentFeedbackInput = z.infer<typeof StudentFeedbackSchema>;

// ============================================================================
// PHASE 3: FINANCIAL SCHEMAS
// ============================================================================

export const CreateCampaignSchema = z.object({
  title: z.string().trim().min(3, 'Campaign title must be at least 3 characters').max(150),
  code: z.string().trim().min(3, 'Campaign code must be at least 3 characters').max(50).toUpperCase(),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  purpose: z.string().trim().min(5, 'Purpose is required'),
  target_amount: z.number().positive('Target amount must be strictly greater than 0'),
  contribution_amount: z.number().positive('Individual contribution amount must be strictly greater than 0'),
  campaign_type: z.enum([
    'FIXED_PER_STUDENT',
    'FACULTY_SPECIFIC',
    'DEPARTMENT_SPECIFIC',
    'CLASS_SPECIFIC',
    'VOLUNTARY',
    'EMERGENCY',
    'WELFARE',
    'EVENT',
  ]),
  scope_type: z.enum(['UNIVERSITY_WIDE', 'FACULTY', 'DEPARTMENT', 'CLASS', 'CUSTOM']).default('UNIVERSITY_WIDE'),
  fund_id: z.string().uuid('Invalid fund UUID'),
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  semester_id: z.string().uuid('Invalid semester UUID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  eligible_faculty_ids: z.array(z.string().uuid()).optional(),
  eligible_department_ids: z.array(z.string().uuid()).optional(),
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export const RecordPaymentSchema = z.object({
  idempotency_key: z.string().trim().min(5, 'Idempotency key required'),
  transaction_reference: z.string().trim().min(3, 'Transaction reference required').max(100),
  student_id: z.string().uuid('Invalid student UUID'),
  campaign_id: z.string().uuid('Invalid campaign UUID'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').default(() => new Date().toISOString().split('T')[0]),
  notes: z.string().trim().optional(),
});
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;

export const VerifyPaymentSchema = z.object({
  verification_note: z.string().trim().optional(),
});
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

export const ReversePaymentSchema = z.object({
  reversal_reason: z.string().trim().min(5, 'Auditable reason is required for reversal'),
});
export type ReversePaymentInput = z.infer<typeof ReversePaymentSchema>;

export const CreateExpenseRequestSchema = z.object({
  title: z.string().trim().min(3).max(150),
  purpose: z.string().trim().min(5),
  description: z.string().trim().optional(),
  campaign_id: z.string().uuid('Invalid campaign UUID'),
  fund_id: z.string().uuid('Invalid fund UUID'),
  requested_amount: z.number().positive('Requested amount must be greater than 0'),
  vendor_name: z.string().trim().min(2, 'Vendor name required').max(150),
  vendor_contact: z.string().trim().optional(),
});
export type CreateExpenseRequestInput = z.infer<typeof CreateExpenseRequestSchema>;

export const ApproveExpenseSchema = z.object({
  approved_amount: z.number().positive('Approved amount must be greater than 0').optional(),
  remarks: z.string().trim().optional(),
});
export type ApproveExpenseInput = z.infer<typeof ApproveExpenseSchema>;

export const ReconcileExpenseSchema = z.object({
  final_amount: z.number().positive().optional(),
  invoice_number: z.string().trim().optional(),
  evidence_files: z.array(
    z.object({
      file_name: z.string(),
      file_path: z.string(),
      file_size_bytes: z.number(),
      mime_type: z.string(),
      is_public: z.boolean().default(true),
    })
  ).min(1, 'At least one verified invoice or receipt proof file is required for reconciliation'),
});
export type ReconcileExpenseInput = z.infer<typeof ReconcileExpenseSchema>;

export const CreateWelfareCaseSchema = z.object({
  student_id: z.string().uuid('Invalid student UUID'),
  requested_amount: z.number().positive('Requested support amount must be greater than 0'),
  confidential_reason: z.string().trim().min(10, 'Confidential justification is required for hardship verification'),
});
export type CreateWelfareCaseInput = z.infer<typeof CreateWelfareCaseSchema>;

export const CreateWaiverSchema = z.object({
  obligation_id: z.string().uuid('Invalid obligation UUID'),
  amount: z.number().positive('Waiver amount must be greater than 0'),
  reason: z.string().trim().min(5, 'Approved reason is required for waiver audit'),
});
export type CreateWaiverInput = z.infer<typeof CreateWaiverSchema>;

// --- Governance: Committees ---
export const CreateCommitteeSchema = z.object({
  name: z.string().trim().min(3, 'Committee name must be at least 3 characters').max(100),
  code: z.string().trim().min(2, 'Code must be at least 2 characters').max(30).toUpperCase(),
  mandate: z.string().trim().min(10, 'Mandate must be at least 10 characters'),
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  chairperson_id: z.string().uuid('Invalid chairperson UUID').optional().nullable(),
  faculty_id: z.string().uuid('Invalid faculty UUID').optional().nullable(),
});
export type CreateCommitteeInput = z.infer<typeof CreateCommitteeSchema>;

export const AssignCommitteeMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user UUID'),
  role_in_committee: z.string().trim().min(2).default('MEMBER'),
});
export type AssignCommitteeMemberInput = z.infer<typeof AssignCommitteeMemberSchema>;

export const CreateCommitteeTaskSchema = z.object({
  committee_id: z.string().uuid('Invalid committee UUID'),
  title: z.string().trim().min(3, 'Task title required').max(150),
  description: z.string().trim().optional(),
  assigned_to: z.string().uuid('Invalid user UUID').optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD').optional().nullable(),
});
export type CreateCommitteeTaskInput = z.infer<typeof CreateCommitteeTaskSchema>;

export const UpdateCommitteeTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']),
});
export type UpdateCommitteeTaskStatusInput = z.infer<typeof UpdateCommitteeTaskStatusSchema>;

// --- Governance: Meetings & Training ---
export const CreateMeetingRequestSchema = z.object({
  title: z.string().trim().min(3, 'Meeting title must be at least 3 characters').max(150),
  type: z.enum(['COUNCIL_MEETING', 'FACULTY_MEETING', 'COMMITTEE_MEETING', 'TRAINING_SESSION', 'GENERAL_ASSEMBLY']),
  faculty_id: z.string().uuid('Invalid faculty UUID').optional().nullable(),
  committee_id: z.string().uuid('Invalid committee UUID').optional().nullable(),
  academic_year_id: z.string().uuid('Invalid academic year UUID'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:MM'),
  venue: z.string().trim().min(2, 'Venue location required').max(150),
  agenda: z.string().trim().min(10, 'Agenda must be at least 10 characters'),
  target_audience: z.string().trim().min(2).default('ALL'),
});
export type CreateMeetingRequestInput = z.infer<typeof CreateMeetingRequestSchema>;

export const ReviewMeetingRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejection_reason: z.string().trim().optional(),
});
export type ReviewMeetingRequestInput = z.infer<typeof ReviewMeetingRequestSchema>;

export const RecordMeetingMinutesSchema = z.object({
  minutes: z.string().trim().min(15, 'Minutes content must be at least 15 characters'),
  official_resolutions: z.string().trim().optional(),
  attendance_count: z.number().int().nonnegative().default(0),
});
export type RecordMeetingMinutesInput = z.infer<typeof RecordMeetingMinutesSchema>;

// --- Governance: Faculty Challenges & Issues ---
export const CreateIssueReportSchema = z.object({
  faculty_id: z.string().uuid('Invalid faculty UUID'),
  department_id: z.string().uuid('Invalid department UUID').optional().nullable(),
  category: z.enum(['ACADEMIC', 'INFRASTRUCTURE', 'WELFARE', 'ADMINISTRATIVE', 'FINANCIAL', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().trim().min(3, 'Issue title must be at least 3 characters').max(150),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
});
export type CreateIssueReportInput = z.infer<typeof CreateIssueReportSchema>;

export const UpdateIssueStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']),
  assigned_to: z.string().uuid('Invalid user UUID').optional().nullable(),
});
export type UpdateIssueStatusInput = z.infer<typeof UpdateIssueStatusSchema>;

export const ResolveIssueSchema = z.object({
  resolution_notes: z.string().trim().min(5, 'Resolution notes are required for resolution audit'),
});
export type ResolveIssueInput = z.infer<typeof ResolveIssueSchema>;

// --- Reports & Analytics Schemas ---
export const ReportFilterQuerySchema = z.object({
  academic_year_id: z.string().uuid('Invalid academic year UUID').optional(),
  faculty_id: z.string().uuid('Invalid faculty UUID').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  format: z.enum(['json', 'csv']).default('json').optional(),
});
export type ReportFilterQueryInput = z.infer<typeof ReportFilterQuerySchema>;

export const AuditExportQuerySchema = z.object({
  report_type: z.enum(['FINANCIAL_AUDIT', 'GOVERNANCE_AUDIT', 'COMPREHENSIVE_AUDIT']).default('COMPREHENSIVE_AUDIT'),
  academic_year_id: z.string().uuid('Invalid academic year UUID').optional(),
});
export type AuditExportQueryInput = z.infer<typeof AuditExportQuerySchema>;

// --- Notification Schemas ---
export const PushSubscriptionSchema = z.object({
  endpoint: z.string().url('Invalid push endpoint URL'),
  keys: z.object({
    p256dh: z.string().min(10, 'Invalid p256dh public key'),
    auth: z.string().min(5, 'Invalid auth secret'),
  }),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;

export const CreateNotificationSchema = z.object({
  user_id: z.string().uuid('Invalid user UUID'),
  title: z.string().trim().min(3).max(150),
  message: z.string().trim().min(5),
  type: z.enum([
    'PAYMENT_VERIFIED',
    'MEETING_APPROVED',
    'ANNOUNCEMENT',
    'TASK_ASSIGNED',
    'EXPENSE_APPROVED',
    'CHALLENGE_UPDATED',
    'SYSTEM',
  ]).default('SYSTEM'),
  action_url: z.string().trim().optional().nullable(),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

// --- Landing Page CMS Settings Schema ---
export const LandingSettingsSchema = z.object({
  hero_title: z.string().trim().min(3, 'Title is required').max(200),
  hero_subtitle: z.string().trim().min(5, 'Subtitle is required').max(500),
  badge_text: z.string().trim().min(2, 'Badge is required').max(100),
  background_image_url: z.string().trim().min(5, 'Background image URL is required'),
  background_overlay_opacity: z.number().min(0).max(1).default(0.75),
  stat_students_count: z.string().trim().min(1).max(50),
  stat_treasury_amount: z.string().trim().min(1).max(50),
  stat_audit_rate: z.string().trim().min(1).max(50),
  feature_1_title: z.string().trim().min(2).max(100),
  feature_1_desc: z.string().trim().min(5).max(300),
  feature_2_title: z.string().trim().min(2).max(100),
  feature_2_desc: z.string().trim().min(5).max(300),
  feature_3_title: z.string().trim().min(2).max(100),
  feature_3_desc: z.string().trim().min(5).max(300),
  announcement_banner: z.string().trim().max(300).optional().nullable(),
});
export type LandingSettingsInput = z.infer<typeof LandingSettingsSchema>;

