-- ============================================================================
-- KEYDSO MAANTA — Database Migration 004: Meetings, Training & Governance
-- ============================================================================

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
