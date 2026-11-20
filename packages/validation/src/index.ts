import { z } from 'zod';

// --- Authentication Schemas ---
export const LoginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const PasswordChangeSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

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
