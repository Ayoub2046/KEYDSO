-- ============================================================================
-- KEYDSO MAANTA — COMPLETE DATABASE SPECIFICATION & DUMP
-- "Every Contribution Matters. Every Action Is Accountable."
-- Product: University Student Representative Council Management System (PWA)
-- Target: PostgreSQL 15+ / Supabase PostgreSQL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TRIGGERS & UTILITY FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. ACADEMIC STRUCTURE MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    is_archived BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_ay_dates CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_ay_semester UNIQUE (academic_year_id, code),
    CONSTRAINT chk_semester_dates CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_faculty_dept UNIQUE (faculty_id, code)
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    contact_number VARCHAR(30),
    email VARCHAR(150),
    enrollment_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_enrollment_status CHECK (
        enrollment_status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'GRADUATED', 'INACTIVE')
    )
);

-- ============================================================================
-- 3. IDENTITY, ROLES & ACCESS CONTROL (RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    contact_number VARCHAR(30),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    student_id UUID UNIQUE REFERENCES students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS faculty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    role_title VARCHAR(100) DEFAULT 'Faculty President' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_active_faculty_rep UNIQUE (faculty_id, academic_year_id, is_active)
);

-- ============================================================================
-- 4. COUNCIL GOVERNANCE, COMMITTEES & MEETINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS committees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    mandate TEXT NOT NULL,
    chairperson_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    faculty_id UUID REFERENCES faculties(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS committee_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_committee VARCHAR(50) DEFAULT 'MEMBER' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_committee_member UNIQUE (committee_id, user_id)
);

CREATE TABLE IF NOT EXISTS committee_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE,
    status VARCHAR(30) DEFAULT 'TODO' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_task_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED'))
);

CREATE TABLE IF NOT EXISTS meetings_and_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL,
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    committee_id UUID REFERENCES committees(id) ON DELETE SET NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    scheduled_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    venue VARCHAR(150) NOT NULL,
    agenda TEXT NOT NULL,
    target_audience VARCHAR(50) DEFAULT 'ALL' NOT NULL,
    status VARCHAR(30) DEFAULT 'REQUESTED' NOT NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    minutes TEXT,
    official_resolutions TEXT,
    attendance_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_meeting_type CHECK (type IN ('COUNCIL_MEETING', 'FACULTY_MEETING', 'COMMITTEE_MEETING', 'TRAINING_SESSION', 'GENERAL_ASSEMBLY')),
    CONSTRAINT chk_meeting_status CHECK (status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE IF NOT EXISTS meeting_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings_and_trainings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ATTENDED' NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_meeting_attendee UNIQUE (meeting_id, user_id),
    CONSTRAINT chk_att_status CHECK (status IN ('ATTENDED', 'EXCUSED', 'ABSENT'))
);

CREATE TABLE IF NOT EXISTS issue_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    faculty_id UUID NOT NULL REFERENCES faculties(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_issue_cat CHECK (category IN ('ACADEMIC', 'INFRASTRUCTURE', 'WELFARE', 'ADMINISTRATIVE', 'FINANCIAL', 'OTHER')),
    CONSTRAINT chk_issue_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_issue_status CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'))
);

-- ============================================================================
-- 5. FINANCIAL ARCHITECTURE & IMMUTABLE GENERAL LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    current_balance DECIMAL(14,2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_fund_balance CHECK (current_balance >= 0)
);

CREATE TABLE IF NOT EXISTS contribution_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    purpose TEXT NOT NULL,
    target_amount DECIMAL(14,2) NOT NULL,
    contribution_amount DECIMAL(14,2) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL,
    scope_type VARCHAR(30) DEFAULT 'UNIVERSITY_WIDE' NOT NULL,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    responsible_officer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'DRAFT' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_camp_target CHECK (target_amount > 0 AND contribution_amount > 0),
    CONSTRAINT chk_camp_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_camp_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS campaign_eligibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES contribution_campaigns(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculties(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES classes(id) ON DELETE RESTRICT,
    student_id UUID REFERENCES students(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS contribution_obligations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    campaign_id UUID NOT NULL REFERENCES contribution_campaigns(id) ON DELETE RESTRICT,
    expected_amount DECIMAL(14,2) NOT NULL,
    verified_paid_amount DECIMAL(14,2) DEFAULT 0.00 NOT NULL,
    waived_amount DECIMAL(14,2) DEFAULT 0.00 NOT NULL,
    sponsored_amount DECIMAL(14,2) DEFAULT 0.00 NOT NULL,
    status VARCHAR(30) DEFAULT 'DUE' NOT NULL,
    confidential_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_student_campaign UNIQUE (student_id, campaign_id),
    CONSTRAINT chk_obligation_amounts CHECK (expected_amount >= 0 AND verified_paid_amount >= 0),
    CONSTRAINT chk_obligation_status CHECK (status IN ('NOT_DUE', 'DUE', 'PARTIALLY_PAID', 'PAID', 'WAIVED', 'SPONSORED', 'DISPUTED', 'OVERDUE'))
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    campaign_id UUID NOT NULL REFERENCES contribution_campaigns(id) ON DELETE RESTRICT,
    amount DECIMAL(14,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_date DATE NOT NULL,
    receipt_number VARCHAR(50) UNIQUE,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    verified_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    verification_date TIMESTAMPTZ,
    verification_note TEXT,
    reversal_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_pay_amount CHECK (amount > 0),
    CONSTRAINT chk_pay_method CHECK (payment_method IN ('CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CHEQUE', 'OTHER')),
    CONSTRAINT chk_pay_status CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'REVERSED'))
);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID UNIQUE NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    amount DECIMAL(14,2) NOT NULL,
    campaign_title VARCHAR(150) NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    issued_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    signature_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    entry_type VARCHAR(20) NOT NULL, -- 'CREDIT' (inflow) or 'DEBIT' (outflow)
    amount DECIMAL(14,2) NOT NULL,
    balance_after DECIMAL(14,2) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    description TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_ledger_type CHECK (entry_type IN ('CREDIT', 'DEBIT')),
    CONSTRAINT chk_ledger_amount CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    purpose TEXT NOT NULL,
    description TEXT,
    campaign_id UUID NOT NULL REFERENCES contribution_campaigns(id) ON DELETE RESTRICT,
    fund_id UUID NOT NULL REFERENCES funds(id) ON DELETE RESTRICT,
    requested_amount DECIMAL(14,2) NOT NULL,
    approved_amount DECIMAL(14,2),
    vendor_name VARCHAR(150) NOT NULL,
    vendor_contact VARCHAR(100),
    requesting_officer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    reviewed_by_finance_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    approved_by_president_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'REQUESTED' NOT NULL,
    disbursed_at TIMESTAMPTZ,
    is_public_summary_published BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_exp_amount CHECK (requested_amount > 0),
    CONSTRAINT chk_exp_status CHECK (status IN ('REQUESTED', 'FINANCE_REVIEWED', 'APPROVED', 'DISBURSED', 'RECONCILED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS evidence_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_public_evidence BOOLEAN DEFAULT FALSE NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS support_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    requested_amount DECIMAL(14,2) NOT NULL,
    approved_amount DECIMAL(14,2) DEFAULT 0.00 NOT NULL,
    confidential_reason TEXT NOT NULL,
    welfare_reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_support_status CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED', 'REJECTED'))
);

-- ============================================================================
-- 6. ANNOUNCEMENTS, FEEDBACK & NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL' NOT NULL,
    target_audience VARCHAR(30) DEFAULT 'ALL' NOT NULL,
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    published_by UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT chk_announcement_cat CHECK (category IN ('GENERAL', 'FINANCE', 'MEETING', 'TRAINING', 'WELFARE')),
    CONSTRAINT chk_announcement_aud CHECK (target_audience IN ('ALL', 'FACULTY', 'COUNCIL'))
);

CREATE TABLE IF NOT EXISTS student_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    faculty_id UUID REFERENCES faculties(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'SUBMITTED' NOT NULL,
    response_notes TEXT,
    responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'SYSTEM' NOT NULL,
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 7. AUDIT LOGGING & TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    previous_state JSONB,
    new_state JSONB
);

-- ============================================================================
-- 8. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_faculty ON students(faculty_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_id_num ON students(student_id_number);
CREATE INDEX IF NOT EXISTS idx_obligations_student ON contribution_obligations(student_id);
CREATE INDEX IF NOT EXISTS idx_obligations_campaign ON contribution_obligations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_campaign ON payments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_ledger_fund ON ledger_entries(fund_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON ledger_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings_and_trainings(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_issues_faculty ON issue_reports(faculty_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON in_app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ============================================================================
-- 9. REPORTING & ANALYTICS VIEWS
-- ============================================================================

-- View: Student Obligation & Remaining Balances
CREATE OR REPLACE VIEW v_student_contribution_summary AS
SELECT
    s.id AS student_id,
    s.student_id_number,
    s.full_name AS student_name,
    f.name AS faculty_name,
    d.name AS department_name,
    c.id AS campaign_id,
    c.title AS campaign_title,
    o.expected_amount,
    o.verified_paid_amount,
    o.waived_amount,
    o.sponsored_amount,
    (o.expected_amount - o.verified_paid_amount - o.waived_amount - o.sponsored_amount) AS remaining_balance,
    o.status AS obligation_status
FROM contribution_obligations o
JOIN students s ON s.id = o.student_id
JOIN faculties f ON f.id = s.faculty_id
JOIN departments d ON d.id = s.department_id
JOIN contribution_campaigns c ON c.id = o.campaign_id;

-- View: Faculty Collection Performance
CREATE OR REPLACE VIEW v_faculty_collection_performance AS
SELECT
    f.id AS faculty_id,
    f.name AS faculty_name,
    f.code AS faculty_code,
    COUNT(DISTINCT s.id) AS student_count,
    COALESCE(SUM(o.expected_amount), 0.00) AS total_expected,
    COALESCE(SUM(o.verified_paid_amount), 0.00) AS total_collected,
    CASE
        WHEN SUM(o.expected_amount) > 0 THEN
            ROUND((SUM(o.verified_paid_amount) / SUM(o.expected_amount)) * 100, 2)
        ELSE 0.00
    END AS collection_rate_percentage,
    COALESCE(SUM(o.expected_amount) - SUM(o.verified_paid_amount), 0.00) AS total_outstanding
FROM faculties f
LEFT JOIN students s ON s.faculty_id = f.id
LEFT JOIN contribution_obligations o ON o.student_id = s.id
GROUP BY f.id, f.name, f.code;

-- View: General Ledger Treasury Position
CREATE OR REPLACE VIEW v_ledger_treasury_reconciliation AS
SELECT
    f.id AS fund_id,
    f.name AS fund_name,
    f.code AS fund_code,
    f.current_balance AS stated_balance,
    COALESCE(SUM(CASE WHEN l.entry_type = 'CREDIT' THEN l.amount ELSE 0 END), 0.00) AS total_credits,
    COALESCE(SUM(CASE WHEN l.entry_type = 'DEBIT' THEN l.amount ELSE 0 END), 0.00) AS total_debits,
    (COALESCE(SUM(CASE WHEN l.entry_type = 'CREDIT' THEN l.amount ELSE 0 END), 0.00) -
     COALESCE(SUM(CASE WHEN l.entry_type = 'DEBIT' THEN l.amount ELSE 0 END), 0.00)) AS calculated_balance,
    CASE
        WHEN f.current_balance = (
            COALESCE(SUM(CASE WHEN l.entry_type = 'CREDIT' THEN l.amount ELSE 0 END), 0.00) -
            COALESCE(SUM(CASE WHEN l.entry_type = 'DEBIT' THEN l.amount ELSE 0 END), 0.00)
        ) THEN TRUE
        ELSE FALSE
    END AS is_reconciled
FROM funds f
LEFT JOIN ledger_entries l ON l.fund_id = f.id
GROUP BY f.id, f.name, f.code, f.current_balance;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE
-- ============================================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Students view only their own records
CREATE POLICY student_view_own_profile ON students
    FOR SELECT TO authenticated
    USING (email = auth.jwt() ->> 'email');

CREATE POLICY student_view_own_obligations ON contribution_obligations
    FOR SELECT TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY student_view_own_payments ON payments
    FOR SELECT TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY student_view_own_notifications ON in_app_notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Public feeds visible to all authenticated users
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_published_announcements ON announcements
    FOR SELECT TO authenticated
    USING (is_published = true);

-- ============================================================================
-- 11. COMPLETE SEED DATA (INITIALIZATION)
-- ============================================================================

-- Roles
INSERT INTO roles (id, name, description, is_system_role) VALUES
    ('10000000-0000-0000-0000-000000000001', 'SYSTEM_ADMIN', 'Full system administration and configuration privileges', true),
    ('10000000-0000-0000-0000-000000000002', 'GENERAL_PRESIDENT', 'General Council President with executive council authority', true),
    ('10000000-0000-0000-0000-000000000003', 'VICE_PRESIDENT', 'Council Vice President with delegated oversight', true),
    ('10000000-0000-0000-0000-000000000004', 'FACULTY_PRESIDENT', 'Faculty Representative President scoped strictly to their faculty', true),
    ('10000000-0000-0000-0000-000000000005', 'FINANCE_OFFICER', 'Finance Committee member managing campaigns, payments and receipts', true),
    ('10000000-0000-0000-0000-000000000006', 'SECRETARY', 'Council Secretariat managing official minutes, correspondence and records', true),
    ('10000000-0000-0000-0000-000000000007', 'COMMITTEE_CHAIR', 'Chairperson of standing or ad-hoc student council committee', true),
    ('10000000-0000-0000-0000-000000000008', 'COMMITTEE_MEMBER', 'Active member of a designated student council committee', true),
    ('10000000-0000-0000-0000-000000000009', 'STUDENT', 'General university student with self-scoped portal access', true)
ON CONFLICT (id) DO NOTHING;

-- Academic Years & Semesters
INSERT INTO academic_years (id, code, name, start_date, end_date, is_current, is_archived) VALUES
    ('20000000-0000-0000-0000-000000000001', 'AY-2025-2026', 'Academic Year 2025/2026', '2025-09-01', '2026-06-30', true, false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO semesters (id, academic_year_id, code, name, start_date, end_date, is_current) VALUES
    ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'S1-2025', 'Semester 1', '2025-09-01', '2026-01-31', false),
    ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'S2-2026', 'Semester 2', '2026-02-01', '2026-06-30', true)
ON CONFLICT (academic_year_id, code) DO NOTHING;

-- Faculties
INSERT INTO faculties (id, code, name, description, is_active) VALUES
    ('30000000-0000-0000-0000-000000000001', 'ENG', 'Faculty of Engineering', 'Civil, Electrical, Mechanical and Industrial Engineering disciplines', true),
    ('30000000-0000-0000-0000-000000000002', 'CSIT', 'Faculty of Computing & Information Technology', 'Computer Science, Software Engineering and Cybersecurity disciplines', true),
    ('30000000-0000-0000-0000-000000000003', 'FBE', 'Faculty of Business & Economics', 'Accounting, Finance, Management and Economics disciplines', true),
    ('30000000-0000-0000-0000-000000000004', 'FHS', 'Faculty of Health Sciences', 'Medicine, Nursing, Public Health and Pharmacy disciplines', true)
ON CONFLICT (code) DO NOTHING;

-- Departments
INSERT INTO departments (id, faculty_id, code, name, is_active) VALUES
    ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'CS', 'Computer Science', true),
    ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'SE', 'Software Engineering', true),
    ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', 'CIVIL', 'Civil & Environmental Engineering', true),
    ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', 'ACC', 'Accounting & Financial Management', true)
ON CONFLICT (faculty_id, code) DO NOTHING;

-- Classes
INSERT INTO classes (id, department_id, academic_year_id, name, is_active) VALUES
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'CS Class of 2026 (Year 3)', true)
ON CONFLICT (id) DO NOTHING;

-- Students
INSERT INTO students (id, student_id_number, full_name, faculty_id, department_id, class_id, academic_year_id, contact_number, email, enrollment_status) VALUES
    ('90000000-0000-0000-0000-000000000001', 'STU-2024-001', 'Safia Abdirahman Hassan', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '+252 61 8999999', 'student.demo@keydso.university.edu', 'ACTIVE')
ON CONFLICT (student_id_number) DO NOTHING;

-- User Profiles (Bcrypt Password: AdminPass123! and StudentPass123!)
-- Hash for 'AdminPass123!': $2a$10$n4s7Qf0FjU8x2oD0k1E2Q.E1R6s6B3Vv6tJb1k0D6v2E1R6s6B3Vv
-- Hash for 'StudentPass123!': $2a$10$s7k2N4FjU8x2oD0k1E2Q.E1R6s6B3Vv6tJb1k0D6v2E1R6s6B3Vv
INSERT INTO profiles (id, email, password_hash, full_name, contact_number, bio, is_active, student_id) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Council System Administrator', '+252 61 5000000', 'Institutional System Administrator & Security Officer', true, NULL),
    ('00000000-0000-0000-0000-000000000002', 'president@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Mohamud Jama Duale', '+252 61 7000001', 'General President of the Student Representative Council. Office: Council House Room 10.', true, NULL),
    ('00000000-0000-0000-0000-000000000003', 'secretary@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Zahra Ahmed Nur', '+252 61 7000003', 'Council Secretary & Head of Secretariat. Responsible for certified meeting records.', true, NULL),
    ('00000000-0000-0000-0000-000000000004', 'eng.rep@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Eng. Khalid Abdi Farah', '+252 61 7000004', 'Faculty President, Engineering. Engineering Building Room 204.', true, NULL),
    ('00000000-0000-0000-0000-000000000005', 'csit.rep@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Hafsa Mohamed Ali', '+252 61 7000005', 'Faculty President, Computing & IT. IT Complex Room 102.', true, NULL),
    ('00000000-0000-0000-0000-000000000010', 'finance.a@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Finance Officer Aisha', '+252 61 7000010', 'Finance Committee Treasury Officer (Maker)', true, NULL),
    ('00000000-0000-0000-0000-000000000011', 'finance.b@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Finance Officer Bashir', '+252 61 7000011', 'Finance Committee Verification Officer (Checker)', true, NULL),
    ('00000000-0000-0000-0000-000000000099', 'student.demo@keydso.university.edu', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.8/k0aI2LpT1zO5Qy1gV4C7d1B5E8.G', 'Safia Abdirahman Hassan', '+252 61 8999999', 'Undergraduate Student, Computer Science', true, '90000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Role Assignments
INSERT INTO user_role_assignments (id, user_id, role_id) VALUES
    ('01000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
    ('01000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
    ('01000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006'),
    ('01000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004'),
    ('01000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004'),
    ('01000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000005'),
    ('01000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005'),
    ('01000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000099', '10000000-0000-0000-0000-000000000009')
ON CONFLICT (id) DO NOTHING;

-- Faculty President Assignments
INSERT INTO faculty_assignments (id, user_id, faculty_id, academic_year_id, role_title, is_active) VALUES
    ('02000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Faculty President', true),
    ('02000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Faculty President', true)
ON CONFLICT (id) DO NOTHING;

-- Treasury Fund
INSERT INTO funds (id, code, name, description, current_balance) VALUES
    ('60000000-0000-0000-0000-000000000001', 'GEN-FUND', 'General Student Council Fund', 'Primary student union treasury for operational and activities funding', 1450.00)
ON CONFLICT (code) DO UPDATE SET current_balance = EXCLUDED.current_balance;

-- Contribution Campaign
INSERT INTO contribution_campaigns (
    id, title, code, description, purpose, target_amount, contribution_amount,
    campaign_type, scope_type, fund_id, academic_year_id, semester_id,
    start_date, end_date, responsible_officer_id, approved_by, status
) VALUES (
    '70000000-0000-0000-0000-000000000001',
    'Semester 2 Campus Transparency & Welfare Drive',
    'CAMP-2026-S2',
    'Campus WiFi enhancement, student council governance, and emergency welfare aid.',
    'Infrastructure upgrade & student welfare support',
    5000.00,
    25.00,
    'FIXED_PER_STUDENT',
    'UNIVERSITY_WIDE',
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000002',
    '2026-02-01',
    '2026-05-30',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'ACTIVE'
) ON CONFLICT (code) DO NOTHING;

-- Student Contribution Obligation
INSERT INTO contribution_obligations (
    id, student_id, campaign_id, expected_amount, verified_paid_amount, waived_amount, sponsored_amount, status
) VALUES (
    '80000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    25.00,
    25.00,
    0.00,
    0.00,
    'PAID'
) ON CONFLICT (id) DO NOTHING;

-- Verified Payment
INSERT INTO payments (
    id, transaction_reference, idempotency_key, student_id, campaign_id, amount,
    payment_method, payment_date, receipt_number, status, recorded_by, verified_by, verification_date
) VALUES (
    '91000000-0000-0000-0000-000000000001',
    'EVC-PLUS-252618999999-TX101',
    'idemp-tx-101',
    '90000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    25.00,
    'MOBILE_MONEY',
    '2026-02-05',
    'REC-2026-0001',
    'VERIFIED',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '2026-02-05T09:30:00Z'
) ON CONFLICT (transaction_reference) DO NOTHING;

-- Digital Receipt with HMAC-SHA256
INSERT INTO receipts (
    id, payment_id, receipt_number, student_name, student_id_number, amount,
    campaign_title, issued_at, issued_by, signature_hash
) VALUES (
    '92000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001',
    'REC-2026-0001',
    'Safia Abdirahman Hassan',
    'STU-2024-001',
    25.00,
    'Semester 2 Campus Transparency & Welfare Drive',
    '2026-02-05T09:30:00Z',
    '00000000-0000-0000-0000-000000000011',
    '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
) ON CONFLICT (receipt_number) DO NOTHING;

-- Reconciled Public Expense
INSERT INTO expenses (
    id, title, purpose, description, campaign_id, fund_id, requested_amount, approved_amount,
    vendor_name, vendor_contact, requesting_officer_id, reviewed_by_finance_id, approved_by_president_id,
    status, disbursed_at, is_public_summary_published
) VALUES (
    '93000000-0000-0000-0000-000000000001',
    'IT Lab Network Switches & High-Speed Patch Cables',
    'Replacement of faulty 24-port Gigabit switches in Central Computing Lab B',
    'Procured from TechZone Supplies under PO-2026-042',
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    320.00,
    320.00,
    'TechZone University Supplies Ltd',
    '+252 61 5554321',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'RECONCILED',
    '2026-02-10T10:00:00Z',
    true
) ON CONFLICT (id) DO NOTHING;

-- Evidence Attachment
INSERT INTO evidence_files (
    id, entity_type, entity_id, file_name, file_path, file_size_bytes, mime_type, is_public_evidence, uploaded_by
) VALUES (
    '94000000-0000-0000-0000-000000000001',
    'EXPENSE',
    '93000000-0000-0000-0000-000000000001',
    'Vendor_Invoice_TechZone_INV882.pdf',
    'expenses/invoices/INV882.pdf',
    425600,
    'application/pdf',
    true,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Balanced Double-Entry General Ledger
-- Balance: Opening ($1745.00) + Payment ($25.00) - Expense ($320.00) = $1450.00
INSERT INTO ledger_entries (
    id, fund_id, entry_type, amount, balance_after, reference_type, reference_id, description, created_by, created_at
) VALUES
    ('95000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'CREDIT', 1745.00, 1745.00, 'OPENING_BALANCE', '60000000-0000-0000-0000-000000000001', 'Opening Council Treasury Balance 2025/2026', '00000000-0000-0000-0000-000000000001', '2026-02-01T08:00:00Z'),
    ('95000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'CREDIT', 25.00, 1770.00, 'STUDENT_PAYMENT', '91000000-0000-0000-0000-000000000001', 'Verified contribution for Safia Abdirahman (STU-2024-001)', '00000000-0000-0000-0000-000000000011', '2026-02-05T09:30:00Z'),
    ('95000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001', 'DEBIT', 320.00, 1450.00, 'EXPENSE_DISBURSEMENT', '93000000-0000-0000-0000-000000000001', 'Disbursement: IT Lab Network Switches & High-Speed Patch Cables', '00000000-0000-0000-0000-000000000001', '2026-02-10T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Confidential Welfare Case
INSERT INTO support_cases (
    id, case_number, student_id, requested_amount, approved_amount, confidential_reason, welfare_reviewer_id, approved_by, status
) VALUES (
    'a2000000-0000-0000-0000-000000000001',
    'WLF-2026-0001',
    '90000000-0000-0000-0000-000000000001',
    50.00,
    50.00,
    'Emergency textbook and medical subsidy due to familial distress.',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'DISBURSED'
) ON CONFLICT (case_number) DO NOTHING;

-- Standing Committees
INSERT INTO committees (id, name, code, mandate, chairperson_id, faculty_id, academic_year_id, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Student Welfare & Social Support Committee', 'WELFARE', 'Identify and address student hardship, food security, emergency medical aid and accommodation needs.', '00000000-0000-0000-0000-000000000004', NULL, '20000000-0000-0000-0000-000000000001', true),
    ('a0000000-0000-0000-0000-000000000002', 'Computing & Digital Campus Committee', 'CSIT-TECH', 'Oversee student lab infrastructure, campus WiFi uptime, programming hackathons and digital advocacy.', '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', true)
ON CONFLICT (code) DO NOTHING;

-- Committee Memberships
INSERT INTO committee_memberships (id, committee_id, user_id, role_in_committee) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'CHAIRPERSON'),
    ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'MEMBER'),
    ('a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'CHAIRPERSON'),
    ('a1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099', 'STUDENT_REPRESENTATIVE')
ON CONFLICT (id) DO NOTHING;

-- Committee Action Tasks
INSERT INTO committee_tasks (id, committee_id, title, description, assigned_to, due_date, status) VALUES
    ('a2100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Publish Ramadan Iftar Student Subsidy Schedule', 'Draft subsidy eligibility criteria and meal ticket allocation procedure for off-campus boarding students.', '00000000-0000-0000-0000-000000000004', '2026-03-01', 'COMPLETED'),
    ('a2100000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Audit Central Computing Lab Switch Replacement', 'Inspect the installed 24-port Gigabit switches in Lab B and test throughput for student programming assignments.', '00000000-0000-0000-0000-000000000005', '2026-02-28', 'IN_PROGRESS'),
    ('a2100000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Annual Inter-Faculty Coding Hackathon Planning', 'Coordinate venue booking, sponsor outreach, and mentorship roster for the 48-hour student hackathon.', '00000000-0000-0000-0000-000000000099', '2026-04-15', 'TODO')
ON CONFLICT (id) DO NOTHING;

-- Meetings & Assemblies
INSERT INTO meetings_and_trainings (
    id, title, type, faculty_id, committee_id, academic_year_id, requested_by,
    scheduled_date, start_time, end_time, venue, agenda, target_audience,
    status, approved_by, minutes, official_resolutions, attendance_count
) VALUES
    ('a4000000-0000-0000-0000-000000000001', 'Semester 2 Executive Council Opening Assembly', 'COUNCIL_MEETING', NULL, NULL, '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '2026-02-02', '10:00', '12:30', 'Council Chamber, Room 10', 'Review Semester 2 contribution drive, committee appointments, and presidential priorities.', 'COUNCIL', 'COMPLETED', '00000000-0000-0000-0000-000000000002', 'Session called to order by General President Mohamud Jama. Unanimously ratified the $25 contribution fee. Directed Finance Committee to establish four-eyes controls.', '1. Contribution rate confirmed at $25. 2. Mandatory dual-approval established for expenditures above $500.', 8),
    ('a4000000-0000-0000-0000-000000000002', 'CSIT Faculty Student Representative Forum', 'FACULTY_MEETING', '30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', '2026-03-20', '14:00', '16:00', 'Computing Complex Hall B', 'Open consultation on software licensing, internship matchmaking, and lab equipment.', 'FACULTY', 'APPROVED', '00000000-0000-0000-0000-000000000002', NULL, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- Faculty Challenges & Issues
INSERT INTO issue_reports (
    id, reference_number, faculty_id, department_id, reported_by, category, priority,
    title, description, assigned_to, status, resolution_notes
) VALUES
    ('a3000000-0000-0000-0000-000000000001', 'ISS-2026-0001', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000099', 'INFRASTRUCTURE', 'HIGH', 'Computing Lab B Projector Lamp Flickering', 'The ceiling projector in Lab B constantly shuts down during Data Structures lectures, impeding 120 students.', '00000000-0000-0000-0000-000000000005', 'IN_PROGRESS', NULL),
    ('a3000000-0000-0000-0000-000000000002', 'ISS-2026-0002', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'ACADEMIC', 'MEDIUM', 'Surveying Total Station Calibration Needed', 'Civil engineering field equipment requires professional calibration before the upcoming midterm field examinations.', '00000000-0000-0000-0000-000000000004', 'SUBMITTED', NULL)
ON CONFLICT (reference_number) DO NOTHING;

-- Council Announcements
INSERT INTO announcements (id, title, content, category, target_audience, is_published, published_by) VALUES
    ('70000000-0000-0000-0000-000000000001', 'Welcome to Keydso Maanta — Student Council Transparency Portal', 'The Student Representative Council is proud to launch Keydso Maanta. Every student can now track contribution campaigns, inspect expenditures, and connect directly with their faculty representatives.', 'GENERAL', 'ALL', true, '00000000-0000-0000-0000-000000000001'),
    ('70000000-0000-0000-0000-000000000002', 'Semester 2 Contribution Campaign Active', 'The Semester 2 Campus Improvement and Student Support Campaign has been officially ratified. Receipts will be issued digitally upon verified payment.', 'FINANCE', 'ALL', true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- In-App Notifications
INSERT INTO in_app_notifications (id, user_id, title, message, type, action_url, is_read, read_at) VALUES
    ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000099', 'Payment Verified & Receipt Issued', 'Your payment of $25.00 for Semester 2 Contribution has been verified. Receipt #REC-2026-0001 is ready to download.', 'PAYMENT_VERIFIED', '/portal/contributions', false, NULL),
    ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000099', 'New Council Announcement', 'Welcome to Keydso Maanta. The Student Representative Council has published the Semester 2 Transparency Agenda.', 'ANNOUNCEMENT', '/portal', true, NOW() - INTERVAL '5 hours'),
    ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'Meeting Proposal Approved', 'Your meeting proposal "CSIT Faculty Student Representative Forum" scheduled for 2026-03-20 was approved by General President.', 'MEETING_APPROVED', '/governance/meetings', false, NULL),
    ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'Expense Reconciled & Published', 'IT Lab Network Switches & High-Speed Patch Cables ($320.00) has been reconciled with verified invoice evidence.', 'EXPENSE_APPROVED', '/finance/expenses', false, NULL)
ON CONFLICT (id) DO NOTHING;
