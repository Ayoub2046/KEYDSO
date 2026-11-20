-- ============================================================================
-- KEYDSO MAANTA — Database Migration 003: Announcements, Representatives & Transparency
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

-- Seed Representative Profiles
INSERT INTO profiles (id, email, password_hash, full_name, contact_number, bio, is_active) VALUES
    ('00000000-0000-0000-0000-000000000002', 'president@keydso.university.edu', 'placeholder-hash', 'Mohamud Jama Duale', '+252 61 7000001', 'General President of the Student Representative Council. Available for institutional advocacy.', true),
    ('00000000-0000-0000-0000-000000000004', 'eng.rep@keydso.university.edu', 'placeholder-hash', 'Eng. Khalid Abdi Farah', '+252 61 7000004', 'Faculty President, Engineering. Engineering Building, Room 204. Office hours: Mon-Wed 2pm-4pm.', true),
    ('00000000-0000-0000-0000-000000000005', 'csit.rep@keydso.university.edu', 'placeholder-hash', 'Hafsa Mohamed Ali', '+252 61 7000005', 'Faculty President, Computing & IT. IT Complex Room 102. Available via WhatsApp & Email.', true)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, contact_number = EXCLUDED.contact_number, bio = EXCLUDED.bio;

-- Assign Representative Roles
INSERT INTO user_role_assignments (id, user_id, role_id) VALUES
    ('01000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
    ('01000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004'),
    ('01000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- Designate Active Faculty Reps
INSERT INTO faculty_assignments (id, user_id, faculty_id, academic_year_id, role_title, is_active) VALUES
    ('02000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Faculty President', true),
    ('02000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Faculty President', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Announcements
INSERT INTO announcements (id, title, content, category, target_audience, is_published, published_by) VALUES
    ('70000000-0000-0000-0000-000000000001', 'Welcome to Keydso Maanta — Student Council Transparency Portal', 'The Student Representative Council is proud to launch Keydso Maanta. Every student can now track contribution campaigns, inspect expenditures, and connect directly with their faculty representatives.', 'GENERAL', 'ALL', true, '00000000-0000-0000-0000-000000000001'),
    ('70000000-0000-0000-0000-000000000002', 'Semester 2 Contribution Campaign Approved', 'The Semester 2 Campus Improvement and Student Support Campaign has been officially ratified. Receipts will be issued digitally upon verified payment.', 'FINANCE', 'ALL', true, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
