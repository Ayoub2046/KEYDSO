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
