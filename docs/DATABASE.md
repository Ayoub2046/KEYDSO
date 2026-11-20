# KEYDSO MAANTA — Database Schema & Data Dictionary
**Document Version:** 1.0.0  
**Target Engine:** PostgreSQL 15+ (Supabase)  
**Security Model:** Normalized relational schema with strict Foreign Keys, Check Constraints, Row Level Security (RLS), and Immutable Financial Ledger.

---

## 1. Schema Design Principles

1. **Strict Relational Integrity:** Enforced via Foreign Keys with explicit `ON DELETE RESTRICT` or `CASCADE` where appropriate. Financial records NEVER permit cascade deletion.
2. **Deterministic Data Types:** UUIDv4 for all primary keys, `DECIMAL(14, 2)` for currency (never floating point `FLOAT` or `DOUBLE`), ISO8601 `TIMESTAMPTZ` for time.
3. **State Integrity Check Constraints:** Status columns validated using explicit SQL `CHECK (status IN (...))`. Amounts validated with `CHECK (amount >= 0)`.
4. **Audit Immutability:** Core financial tables (`ledger_entries`, `payments`, `receipts`, `audit_logs`) use append-only or reversal architectures. Hard deletion is disabled via DB triggers.
5. **Multi-Tenant / Scope Isolation:** Row Level Security (RLS) active on all tables. Faculty presidents can only access records scoped to `faculty_id`. Students can only select records where `student_id = auth.uid()` or public council summaries.

---

## 2. Comprehensive Entity Data Dictionary

### 2.1 Academic Entities

#### `academic_years`
Represents an institutional academic cycle (e.g., 2025-2026).
- `id` (UUID, PK, default `gen_random_uuid()`)
- `code` (VARCHAR(30), UNIQUE, NOT NULL) — e.g. "AY-2025-2026"
- `name` (VARCHAR(100), NOT NULL) — e.g. "Academic Year 2025/2026"
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `is_current` (BOOLEAN, DEFAULT FALSE)
- `is_archived` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())
- *Constraint:* `CHECK (end_date > start_date)`

#### `semesters`
Academic subdivisions within a year.
- `id` (UUID, PK)
- `academic_year_id` (UUID, FK -> `academic_years.id`, NOT NULL)
- `name` (VARCHAR(50), NOT NULL) — e.g. "Semester 1", "Semester 2"
- `code` (VARCHAR(30), NOT NULL) — e.g. "S1-2025"
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `is_current` (BOOLEAN, DEFAULT FALSE)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Constraint:* `UNIQUE (academic_year_id, code)`

#### `faculties`
Institutional faculties / colleges.
- `id` (UUID, PK)
- `code` (VARCHAR(20), UNIQUE, NOT NULL) — e.g. "ENG", "FHS", "FED"
- `name` (VARCHAR(150), NOT NULL) — e.g. "Faculty of Engineering"
- `description` (TEXT)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `departments`
Academic departments under faculties.
- `id` (UUID, PK)
- `faculty_id` (UUID, FK -> `faculties.id` ON DELETE RESTRICT, NOT NULL)
- `code` (VARCHAR(20), NOT NULL) — e.g. "CS", "CIVIL"
- `name` (VARCHAR(150), NOT NULL) — e.g. "Computer Science & IT"
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Constraint:* `UNIQUE (faculty_id, code)`

#### `classes`
Class cohorts or year groups.
- `id` (UUID, PK)
- `department_id` (UUID, FK -> `departments.id` ON DELETE RESTRICT, NOT NULL)
- `name` (VARCHAR(100), NOT NULL) — e.g. "Class of 2026", "Year 3 CS"
- `academic_year_id` (UUID, FK -> `academic_years.id`, NOT NULL)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `students`
Student master record.
- `id` (UUID, PK) — Links 1:1 to `profiles.id` if student has login
- `student_id_number` (VARCHAR(50), UNIQUE, NOT NULL) — Institutional ID (e.g. "STU-2024-001")
- `full_name` (VARCHAR(150), NOT NULL)
- `faculty_id` (UUID, FK -> `faculties.id`, NOT NULL)
- `department_id` (UUID, FK -> `departments.id`, NOT NULL)
- `class_id` (UUID, FK -> `classes.id`, NOT NULL)
- `academic_year_id` (UUID, FK -> `academic_years.id`, NOT NULL)
- `contact_number` (VARCHAR(30))
- `email` (VARCHAR(150))
- `enrollment_status` (VARCHAR(30), DEFAULT 'ACTIVE')
  - *CHECK:* `enrollment_status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'GRADUATED', 'INACTIVE')`
- `registration_date` (DATE, NOT NULL, DEFAULT CURRENT_DATE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

### 2.2 Identity, RBAC & Council Assignments

#### `profiles`
User identity accounts.
- `id` (UUID, PK) — References `auth.users(id)` in Supabase
- `email` (VARCHAR(150), UNIQUE, NOT NULL)
- `full_name` (VARCHAR(150), NOT NULL)
- `avatar_url` (TEXT)
- `contact_number` (VARCHAR(30))
- `bio` (TEXT)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `roles`
System roles.
- `id` (UUID, PK)
- `name` (VARCHAR(50), UNIQUE, NOT NULL) — `SYSTEM_ADMIN`, `GENERAL_PRESIDENT`, `VICE_PRESIDENT`, `FACULTY_PRESIDENT`, `FINANCE_OFFICER`, `SECRETARY`, `COMMITTEE_CHAIR`, `COMMITTEE_MEMBER`, `STUDENT`
- `description` (TEXT)
- `is_system_role` (BOOLEAN, DEFAULT TRUE)

#### `permissions`
Granular permission actions.
- `id` (UUID, PK)
- `name` (VARCHAR(100), UNIQUE, NOT NULL) — e.g. `finance:create_campaign`, `expense:approve`, `faculty:view_scoped`
- `module` (VARCHAR(50), NOT NULL)
- `description` (TEXT)

#### `role_permissions`
Join table mapping roles to permissions.
- `role_id` (UUID, FK -> `roles.id`, NOT NULL)
- `permission_id` (UUID, FK -> `permissions.id`, NOT NULL)
- PK `(role_id, permission_id)`

#### `user_role_assignments`
Maps users to roles.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `role_id` (UUID, FK -> `roles.id`, NOT NULL)
- `assigned_by` (UUID, FK -> `profiles.id`)
- `assigned_at` (TIMESTAMPTZ, DEFAULT NOW())
- *Constraint:* `UNIQUE (user_id, role_id)`

#### `faculty_assignments`
Designates representative scopes (e.g. Faculty President).
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `faculty_id` (UUID, FK -> `faculties.id`, NOT NULL)
- `academic_year_id` (UUID, FK -> `academic_years.id`, NOT NULL)
- `role_title` (VARCHAR(100), DEFAULT 'Faculty President')
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `assigned_at` (TIMESTAMPTZ, DEFAULT NOW())
- *Constraint:* `UNIQUE (faculty_id, academic_year_id, is_active)`

#### `committees`
Student council committees.
- `id` (UUID, PK)
- `name` (VARCHAR(100), NOT NULL)
- `code` (VARCHAR(30), UNIQUE, NOT NULL)
- `mandate` (TEXT, NOT NULL)
- `chairperson_id` (UUID, FK -> `profiles.id`)
- `faculty_id` (UUID, FK -> `faculties.id`) — NULL if institution-wide
- `academic_year_id` (UUID, FK -> `academic_years.id`, NOT NULL)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `committee_memberships`
- `id` (UUID, PK)
- `committee_id` (UUID, FK -> `committees.id`, NOT NULL)
- `user_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `role_in_committee` (VARCHAR(50), DEFAULT 'MEMBER') — CHAIR, VICE_CHAIR, SECRETARY, MEMBER
- `joined_at` (TIMESTAMPTZ, DEFAULT NOW())
- *Constraint:* `UNIQUE (committee_id, user_id)`

---

### 2.3 Financial Architecture & Accounting Ledger

#### `funds`
High-level fund pools (e.g. General Student Fund, Welfare Fund, Sports Fund).
- `id` (UUID, PK)
- `name` (VARCHAR(100), NOT NULL)
- `code` (VARCHAR(30), UNIQUE, NOT NULL)
- `description` (TEXT)
- `current_balance` (DECIMAL(14,2), DEFAULT 0.00, NOT NULL)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Constraint:* `CHECK (current_balance >= 0)`

#### `contribution_campaigns`
Financial drives with specific targets and scopes.
- `id` (UUID, PK)
- `title` (VARCHAR(150), NOT NULL)
- `code` (VARCHAR(50), UNIQUE, NOT NULL)
- `description` (TEXT, NOT NULL)
- `purpose` (TEXT, NOT NULL)
- `target_amount` (DECIMAL(14,2), NOT NULL)
- `contribution_amount` (DECIMAL(14,2), NOT NULL)
- `campaign_type` (VARCHAR(50), NOT NULL)
  - *CHECK:* `campaign_type IN ('FIXED_PER_STUDENT', 'FACULTY_SPECIFIC', 'DEPARTMENT_SPECIFIC', 'CLASS_SPECIFIC', 'VOLUNTARY', 'EMERGENCY', 'WELFARE', 'EVENT')`
- `scope_type` (VARCHAR(30), DEFAULT 'UNIVERSITY_WIDE')
  - *CHECK:* `scope_type IN ('UNIVERSITY_WIDE', 'FACULTY', 'DEPARTMENT', 'CLASS', 'CUSTOM')`
- `fund_id` (UUID, FK -> `funds.id`, NOT NULL)
- `academic_year_id` (UUID, FK -> `academic_years.id`, NOT NULL)
- `semester_id` (UUID, FK -> `semesters.id`, NOT NULL)
- `start_date` (DATE, NOT NULL)
- `end_date` (DATE, NOT NULL)
- `responsible_officer_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `approved_by` (UUID, FK -> `profiles.id`)
- `status` (VARCHAR(30), DEFAULT 'DRAFT')
  - *CHECK:* `status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'CLOSED', 'ARCHIVED')`
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `campaign_eligibility`
Defines targeted cohorts for a campaign.
- `id` (UUID, PK)
- `campaign_id` (UUID, FK -> `contribution_campaigns.id` ON DELETE CASCADE, NOT NULL)
- `faculty_id` (UUID, FK -> `faculties.id`)
- `department_id` (UUID, FK -> `departments.id`)
- `class_id` (UUID, FK -> `classes.id`)
- `student_id` (UUID, FK -> `students.id`)

#### `contribution_obligations`
Individual student financial liability for a campaign.
- `id` (UUID, PK)
- `student_id` (UUID, FK -> `students.id`, NOT NULL)
- `campaign_id` (UUID, FK -> `contribution_campaigns.id`, NOT NULL)
- `expected_amount` (DECIMAL(14,2), NOT NULL)
- `verified_paid_amount` (DECIMAL(14,2), DEFAULT 0.00, NOT NULL)
- `waived_amount` (DECIMAL(14,2), DEFAULT 0.00, NOT NULL)
- `sponsored_amount` (DECIMAL(14,2), DEFAULT 0.00, NOT NULL)
- `remaining_balance` (DECIMAL(14,2) GENERATED ALWAYS AS (expected_amount - verified_paid_amount - waived_amount - sponsored_amount) STORED)
- `status` (VARCHAR(30), DEFAULT 'DUE')
  - *CHECK:* `status IN ('NOT_DUE', 'DUE', 'PARTIALLY_PAID', 'PAID', 'WAIVED', 'SPONSORED', 'DISPUTED', 'OVERDUE')`
- `confidential_note` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Constraint:* `UNIQUE (student_id, campaign_id)`
- *Constraint:* `CHECK (expected_amount >= 0 AND verified_paid_amount >= 0)`

#### `payments`
Recorded payment transactions.
- `id` (UUID, PK)
- `transaction_reference` (VARCHAR(100), UNIQUE, NOT NULL) — e.g. Mobile money ref, bank deposit code
- `idempotency_key` (VARCHAR(100), UNIQUE, NOT NULL)
- `student_id` (UUID, FK -> `students.id`, NOT NULL)
- `campaign_id` (UUID, FK -> `contribution_campaigns.id`, NOT NULL)
- `amount` (DECIMAL(14,2), NOT NULL)
- `payment_method` (VARCHAR(30), NOT NULL)
  - *CHECK:* `payment_method IN ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')`
- `payment_date` (DATE, NOT NULL)
- `receipt_number` (VARCHAR(50), UNIQUE)
- `status` (VARCHAR(30), DEFAULT 'PENDING')
  - *CHECK:* `status IN ('PENDING', 'VERIFIED', 'REJECTED', 'REVERSED')`
- `recorded_by` (UUID, FK -> `profiles.id`, NOT NULL)
- `verified_by` (UUID, FK -> `profiles.id`)
- `verification_date` (TIMESTAMPTZ)
- `verification_note` (TEXT)
- `reversal_reason` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Constraint:* `CHECK (amount > 0)`

#### `ledger_entries`
Immutable double-entry audit ledger for financial movements.
- `id` (UUID, PK)
- `fund_id` (UUID, FK -> `funds.id`, NOT NULL)
- `entry_type` (VARCHAR(20), NOT NULL) — `CREDIT` (incoming collection) or `DEBIT` (expense disbursement)
- `amount` (DECIMAL(14,2), NOT NULL)
- `balance_after` (DECIMAL(14,2), NOT NULL)
- `reference_type` (VARCHAR(50), NOT NULL) — `PAYMENT`, `EXPENSE`, `REVERSAL`, `ADJUSTMENT`
- `reference_id` (UUID, NOT NULL)
- `description` (TEXT, NOT NULL)
- `created_by` (UUID, FK -> `profiles.id`, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL)
- *Rule:* Table is append-only. UPDATE and DELETE are revoked via SQL trigger.

#### `receipts`
Digitally signed transaction receipts.
- `id` (UUID, PK)
- `payment_id` (UUID, FK -> `payments.id`, NOT NULL, UNIQUE)
- `receipt_number` (VARCHAR(50), UNIQUE, NOT NULL)
- `student_name` (VARCHAR(150), NOT NULL)
- `student_id_number` (VARCHAR(50), NOT NULL)
- `amount` (DECIMAL(14,2), NOT NULL)
- `campaign_title` (VARCHAR(150), NOT NULL)
- `issued_at` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL)
- `issued_by` (UUID, FK -> `profiles.id`, NOT NULL)
- `signature_hash` (TEXT, NOT NULL) — HMAC-SHA256 of receipt attributes

#### `waivers`
Authorized financial relief.
- `id` (UUID, PK)
- `obligation_id` (UUID, FK -> `contribution_obligations.id`, NOT NULL)
- `amount` (DECIMAL(14,2), NOT NULL)
- `reason` (TEXT, NOT NULL)
- `approved_by` (UUID, FK -> `profiles.id`, NOT NULL)
- `approved_at` (TIMESTAMPTZ, DEFAULT NOW())

#### `expenses` & `expense_requests`
Expenditures tied to campaigns.
- `id` (UUID, PK)
- `title` (VARCHAR(150), NOT NULL)
- `purpose` (TEXT, NOT NULL)
- `description` (TEXT)
- `campaign_id` (UUID, FK -> `contribution_campaigns.id`, NOT NULL)
- `fund_id` (UUID, FK -> `funds.id`, NOT NULL)
- `requested_amount` (DECIMAL(14,2), NOT NULL)
- `approved_amount` (DECIMAL(14,2))
- `vendor_name` (VARCHAR(150), NOT NULL)
- `vendor_contact` (VARCHAR(100))
- `requesting_officer_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `reviewed_by_finance_id` (UUID, FK -> `profiles.id`)
- `approved_by_president_id` (UUID, FK -> `profiles.id`)
- `status` (VARCHAR(30), DEFAULT 'REQUESTED')
  - *CHECK:* `status IN ('REQUESTED', 'FINANCE_REVIEWED', 'APPROVED', 'DISBURSED', 'RECONCILED', 'REJECTED')`
- `disbursed_at` (TIMESTAMPTZ)
- `is_public_summary_published` (BOOLEAN, DEFAULT FALSE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `evidence_files`
Receipts, invoices, event photos.
- `id` (UUID, PK)
- `entity_type` (VARCHAR(50), NOT NULL) — `EXPENSE`, `MEETING`, `TRAINING`, `CHALLENGE`, `WELFARE`
- `entity_id` (UUID, NOT NULL)
- `file_name` (VARCHAR(255), NOT NULL)
- `file_path` (TEXT, NOT NULL) — Encrypted storage bucket path
- `file_size_bytes` (BIGINT, NOT NULL)
- `mime_type` (VARCHAR(100), NOT NULL)
- `is_public_evidence` (BOOLEAN, DEFAULT FALSE)
- `uploaded_by` (UUID, FK -> `profiles.id`, NOT NULL)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

#### `support_cases` (Student Welfare)
Confidential hardship cases.
- `id` (UUID, PK)
- `case_number` (VARCHAR(50), UNIQUE, NOT NULL)
- `student_id` (UUID, FK -> `students.id`, NOT NULL)
- `requested_amount` (DECIMAL(14,2), NOT NULL)
- `approved_amount` (DECIMAL(14,2), DEFAULT 0.00)
- `confidential_reason` (TEXT, NOT NULL)
- `welfare_reviewer_id` (UUID, FK -> `profiles.id`)
- `approved_by` (UUID, FK -> `profiles.id`)
- `status` (VARCHAR(30), DEFAULT 'SUBMITTED')
  - *CHECK:* `status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'REJECTED')`
- `created_at`, `updated_at` (TIMESTAMPTZ)
- *Security:* Strict RLS — Welfare Committee and Finance Approvers ONLY.

---

### 2.4 Governance, Meetings & Challenges

#### `meeting_requests` & `meetings`
- `id` (UUID, PK)
- `faculty_id` (UUID, FK -> `faculties.id`) — NULL if central council
- `committee_id` (UUID, FK -> `committees.id`)
- `title` (VARCHAR(150), NOT NULL)
- `objective` (TEXT, NOT NULL)
- `scheduled_date` (DATE, NOT NULL)
- `start_time` (TIME, NOT NULL)
- `end_time` (TIME, NOT NULL)
- `venue` (VARCHAR(150), NOT NULL)
- `organizer_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `status` (VARCHAR(30), DEFAULT 'REQUESTED')
  - *CHECK:* `status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED')`
- `approved_by` (UUID, FK -> `profiles.id`)
- `minutes_text` (TEXT)
- `attendance_count` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `training_events`
- `id` (UUID, PK)
- `title` (VARCHAR(150), NOT NULL)
- `topic` (VARCHAR(150), NOT NULL)
- `trainer_name` (VARCHAR(150), NOT NULL)
- `target_audience` (TEXT, NOT NULL)
- `learning_objectives` (TEXT, NOT NULL)
- `faculty_id` (UUID, FK -> `faculties.id`)
- `estimated_budget` (DECIMAL(14,2), DEFAULT 0.00)
- `status` (VARCHAR(30), DEFAULT 'REQUESTED')
- `approved_by` (UUID, FK -> `profiles.id`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `issue_reports` (Faculty Challenges)
- `id` (UUID, PK)
- `reference_number` (VARCHAR(50), UNIQUE, NOT NULL) — e.g. "ISSUE-2026-0042"
- `faculty_id` (UUID, FK -> `faculties.id`, NOT NULL)
- `department_id` (UUID, FK -> `departments.id`)
- `reported_by` (UUID, FK -> `profiles.id`, NOT NULL)
- `category` (VARCHAR(50), NOT NULL)
  - *CHECK:* `category IN ('ACADEMIC', 'INFRASTRUCTURE', 'WELFARE', 'ADMINISTRATIVE', 'FINANCIAL', 'OTHER')`
- `priority` (VARCHAR(20), NOT NULL)
  - *CHECK:* `priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`
- `title` (VARCHAR(150), NOT NULL)
- `description` (TEXT, NOT NULL)
- `assigned_to` (UUID, FK -> `profiles.id`)
- `status` (VARCHAR(30), DEFAULT 'SUBMITTED')
  - *CHECK:* `status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')`
- `resolution_notes` (TEXT)
- `resolved_at` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `committee_tasks` & `committee_activity_logs`
- `id` (UUID, PK)
- `committee_id` (UUID, FK -> `committees.id`, NOT NULL)
- `title` (VARCHAR(150), NOT NULL)
- `description` (TEXT)
- `assigned_to` (UUID, FK -> `profiles.id`)
- `due_date` (DATE)
- `status` (VARCHAR(30), DEFAULT 'TODO') — `TODO`, `IN_PROGRESS`, `UNDER_REVIEW`, `COMPLETED`
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

### 2.5 Security, Audit & Notifications

#### `audit_logs`
System-wide immutable action log.
- `id` (BIGSERIAL, PK)
- `timestamp` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL)
- `actor_id` (UUID, FK -> `profiles.id`)
- `action` (VARCHAR(100), NOT NULL) — e.g. `PAYMENT_VERIFIED`, `CAMPAIGN_APPROVED`, `STUDENT_IMPORTED`
- `entity_type` (VARCHAR(50), NOT NULL)
- `entity_id` (VARCHAR(100), NOT NULL)
- `ip_address` (VARCHAR(45))
- `user_agent` (TEXT)
- `previous_state` (JSONB)
- `new_state` (JSONB)
- *Constraint:* Append-only via DB trigger.

#### `notifications`
- `id` (UUID, PK)
- `user_id` (UUID, FK -> `profiles.id`, NOT NULL)
- `title` (VARCHAR(150), NOT NULL)
- `message` (TEXT, NOT NULL)
- `notification_type` (VARCHAR(50), NOT NULL)
- `action_url` (VARCHAR(255))
- `is_read` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
