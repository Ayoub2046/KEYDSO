-- ============================================================================
-- KEYDSO MAANTA — Database Migration 002: Seed Initial Roles, Structure & Admin
-- ============================================================================

-- 1. SEED ROLES
INSERT INTO roles (id, name, description, is_system_role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'SYSTEM_ADMIN', 'Full system administration and configuration privileges', true),
    ('00000000-0000-0000-0000-000000000002', 'GENERAL_PRESIDENT', 'General Council President with executive council authority', true),
    ('00000000-0000-0000-0000-000000000003', 'VICE_PRESIDENT', 'Council Vice President with delegated oversight', true),
    ('00000000-0000-0000-0000-000000000004', 'FACULTY_PRESIDENT', 'Faculty Representative President scoped strictly to their faculty', true),
    ('00000000-0000-0000-0000-000000000005', 'FINANCE_OFFICER', 'Finance Committee member managing campaigns, payments and receipts', true),
    ('00000000-0000-0000-0000-000000000006', 'SECRETARY', 'Council Secretariat managing official minutes, correspondence and records', true),
    ('00000000-0000-0000-0000-000000000007', 'COMMITTEE_CHAIR', 'Chairperson of standing or ad-hoc student council committee', true),
    ('00000000-0000-0000-0000-000000000008', 'COMMITTEE_MEMBER', 'Active member of a designated student council committee', true),
    ('00000000-0000-0000-0000-000000000009', 'STUDENT', 'General university student with self-scoped portal access', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PERMISSIONS
INSERT INTO permissions (name, module, description) VALUES
    ('academic:manage_structure', 'academic', 'Create and modify academic years, semesters, faculties, departments, and classes'),
    ('student:bulk_import', 'student', 'Bulk import student cohorts from CSV/XLSX'),
    ('student:view_directory', 'student', 'View student directory (scoped by faculty or public)'),
    ('student:view_own_profile', 'student', 'View and manage personal student profile'),
    ('finance:create_campaign', 'finance', 'Create student contribution campaigns'),
    ('finance:approve_campaign', 'finance', 'Approve submitted contribution campaigns'),
    ('finance:record_payment', 'finance', 'Record student payments across methods'),
    ('finance:verify_payment', 'finance', 'Verify pending payments and issue signed receipts'),
    ('finance:reverse_payment', 'finance', 'Issue auditable payment reversals with documented reasons'),
    ('finance:reconcile', 'finance', 'Reconcile ledger accounts against banking and mobile records'),
    ('finance:view_own_obligations', 'finance', 'View personal contribution liabilities and payment history'),
    ('expense:request', 'expense', 'Draft expenditure requests against approved campaign funds'),
    ('expense:review', 'expense', 'Conduct finance review on expenditure proposals'),
    ('expense:approve', 'expense', 'Formally authorize expenditures (presidential or dual approval)'),
    ('welfare:submit_case', 'welfare', 'Submit confidential student hardship support case'),
    ('welfare:review_case', 'welfare', 'Review hardship applications (Welfare Committee restricted)'),
    ('welfare:approve_case', 'welfare', 'Authorize welfare disbursements'),
    ('meeting:request', 'council', 'Submit meeting agenda and schedule proposal'),
    ('meeting:approve', 'council', 'Approve requested meetings'),
    ('meeting:record_minutes', 'council', 'Record and publish official meeting minutes'),
    ('challenge:submit', 'challenges', 'Report departmental or student challenge'),
    ('challenge:resolve', 'challenges', 'Update and resolve assigned challenge reports'),
    ('council:view_audit_logs', 'audit', 'Inspect system-wide immutable audit trail')
ON CONFLICT (name) DO NOTHING;

-- 3. SEED ACADEMIC STRUCTURE
INSERT INTO academic_years (id, code, name, start_date, end_date, is_current, is_archived) VALUES
    ('10000000-0000-0000-0000-000000000001', 'AY-2025-2026', 'Academic Year 2025/2026', '2025-09-01', '2026-06-30', true, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO semesters (id, academic_year_id, code, name, start_date, end_date, is_current) VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'S1-2025', 'Semester 1', '2025-09-01', '2026-01-31', false),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'S2-2026', 'Semester 2', '2026-02-01', '2026-06-30', true)
ON CONFLICT (academic_year_id, code) DO NOTHING;

-- 4. SEED FACULTIES
INSERT INTO faculties (id, code, name, description, is_active) VALUES
    ('30000000-0000-0000-0000-000000000001', 'ENG', 'Faculty of Engineering', 'Civil, Electrical, Mechanical and Industrial Engineering', true),
    ('30000000-0000-0000-0000-000000000002', 'CSIT', 'Faculty of Computing & Information Technology', 'Computer Science, Software Engineering and Cybersecurity', true),
    ('30000000-0000-0000-0000-000000000003', 'FBE', 'Faculty of Business & Economics', 'Accounting, Finance, Management and Economics', true),
    ('30000000-0000-0000-0000-000000000004', 'FHS', 'Faculty of Health Sciences', 'Medicine, Nursing, Public Health and Pharmacy', true)
ON CONFLICT (code) DO NOTHING;

-- 5. SEED DEPARTMENTS
INSERT INTO departments (id, faculty_id, code, name, is_active) VALUES
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'CS', 'Computer Science', true),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'SE', 'Software Engineering', true),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'CIVIL', 'Civil & Environmental Engineering', true),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'ACC', 'Accounting & Financial Management', true)
ON CONFLICT (faculty_id, code) DO NOTHING;

-- 6. SEED CLASSES
INSERT INTO classes (id, department_id, academic_year_id, name, is_active) VALUES
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CS Class of 2026 (Year 3)', true),
    ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'SE Class of 2027 (Year 2)', true)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED CORE FUND
INSERT INTO funds (id, code, name, description, current_balance) VALUES
    ('60000000-0000-0000-0000-000000000001', 'GEN-FUND', 'General Student Council Fund', 'Primary student union treasury for operational and activities funding', 0.00)
ON CONFLICT (code) DO NOTHING;
