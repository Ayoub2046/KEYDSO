# KEYDSO MAANTA — Entity Relationship Diagram (ERD)
**Document Version:** 1.0.0  
**Status:** Approved for Schema Generation

---

## 1. Core Academic & Identity Architecture

```mermaid
erDiagram
    academic_years ||--o{ semesters : contains
    academic_years ||--o{ classes : organizes
    academic_years ||--o{ students : enrolls
    academic_years ||--o{ contribution_campaigns : spans

    faculties ||--o{ departments : contains
    faculties ||--o{ faculty_assignments : assigns
    faculties ||--o{ issue_reports : experiences
    faculties ||--o{ students : enrolls

    departments ||--o{ classes : groups
    departments ||--o{ students : assigns

    classes ||--o{ students : cohorts

    profiles ||--o{ user_role_assignments : possesses
    roles ||--o{ user_role_assignments : designates
    roles ||--o{ role_permissions : defines
    permissions ||--o{ role_permissions : grants

    profiles ||--o{ faculty_assignments : acts_as_rep
    profiles ||--o{ committee_memberships : participates
    committees ||--o{ committee_memberships : enlists
    committees ||--o{ committee_tasks : tracks
    committees ||--o{ committee_activity_logs : logs

    profiles ||--o| students : linked_identity
```

---

## 2. Financial Ecosystem & Audit Trail

```mermaid
erDiagram
    funds ||--o{ contribution_campaigns : holds_target_for
    funds ||--o{ ledger_entries : tracks_balance_change
    funds ||--o{ expenses : funds_disbursement

    contribution_campaigns ||--o{ campaign_eligibility : targets
    contribution_campaigns ||--o{ contribution_obligations : incurs
    contribution_campaigns ||--o{ payments : collects
    contribution_campaigns ||--o{ expenses : incurs_costs

    students ||--o{ contribution_obligations : owes
    students ||--o{ payments : pays
    students ||--o{ support_cases : receives_welfare

    contribution_obligations ||--o{ waivers : adjusted_by
    payments ||--o| receipts : produces
    payments ||--o{ ledger_entries : generates_credit
    expenses ||--o{ ledger_entries : generates_debit

    expenses ||--o{ evidence_files : documented_by
    issue_reports ||--o{ evidence_files : supported_by
    meetings ||--o{ evidence_files : records_photos

    profiles ||--o{ audit_logs : triggers
    profiles ||--o{ notifications : receives
```

---

## 3. Relational Cardinality & Integrity Matrix

| Parent Table | Child Table | Foreign Key | Constraint Rule | Business Meaning |
|---|---|---|---|---|
| `academic_years` | `semesters` | `academic_year_id` | `ON DELETE RESTRICT` | A year cannot be purged if it has active semesters. |
| `faculties` | `departments` | `faculty_id` | `ON DELETE RESTRICT` | Departments cannot be orphaned without a faculty. |
| `departments` | `students` | `department_id` | `ON DELETE RESTRICT` | Students must belong to a verified valid department. |
| `contribution_campaigns` | `contribution_obligations` | `campaign_id` | `ON DELETE RESTRICT` | Campaigns with active student obligations cannot be deleted. |
| `contribution_obligations` | `waivers` | `obligation_id` | `ON DELETE RESTRICT` | Waivers must reference an active student liability. |
| `payments` | `receipts` | `payment_id` | `ON DELETE RESTRICT` | A verified receipt cannot exist without its originating payment. |
| `funds` | `ledger_entries` | `fund_id` | `ON DELETE RESTRICT` | Ledger records are permanent; fund references cannot be severed. |
| `expenses` | `evidence_files` | `entity_id` | `ON DELETE RESTRICT` | Approved expenses must maintain linked invoices and evidence. |
