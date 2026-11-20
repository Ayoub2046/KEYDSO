# KEYDSO MAANTA — Architectural & Policy Assumptions Requiring Council Approval
**Document Version:** 1.0.0  
**Target Stakeholders:** Student Representative Council Leadership, Finance Committee, University Administration

---

## Purpose of this Document

In accordance with professional engineering ethics and the project mandate, the software engineering team **must not invent** university institutional data, financial approval thresholds, student ID standards, or faculty hierarchies. 

Below is the definitive catalog of assumptions incorporated into the initial architectural blueprint. These assumptions require review, confirmation, or adjustment by the student council leadership before production live deployment.

---

## 1. Financial Policies & Thresholds

| # | Domain Policy | Baseline Assumption in Blueprint | Council Decision Required |
|---|---|---|---|
| **F-01** | **Two-Person Approval Threshold** | Expenses exceeding **$500.00** require dual sign-off (General President + Finance Committee Chairperson). Expenses at or below $500 require General President approval only. | *Confirm or adjust dollar threshold. Should specific categories (e.g. equipment vs refreshments) have different limits?* |
| **F-02** | **Payment Method Verification** | Cash payments and manual mobile transfers are logged as `PENDING` by receiving finance officers, and must be verified by a separate authorized officer before a receipt is finalized. | *Confirm whether automated mobile money gateway integration (e.g., automated webhook verification) is expected in later stages or if manual reference verification is preferred.* |
| **F-03** | **Financial Transparency Granularity** | General students can inspect all approved expenditures (vendor, amount, purpose, approval date, and public receipt images). Student welfare disbursements are reported strictly as aggregated anonymized sums (e.g., "$1,200 disbursed across 6 approved welfare recipients"). | *Confirm if student assemblies require line-item welfare amounts to be anonymized or if additional privacy restrictions apply.* |
| **F-04** | **Reversals vs Adjustments** | Erroneous payments cannot be deleted. An authorized reversal generates an inverse `DEBIT` ledger entry referencing the original transaction ID with mandatory reviewer remarks. | *Confirm who has the final authority to sign off on payment reversals (General President vs Finance Chair).* |

---

## 2. Academic Hierarchy & Student Identification

| # | Domain Policy | Baseline Assumption in Blueprint | Council Decision Required |
|---|---|---|---|
| **A-01** | **Student Identification Format** | Student IDs are alphanumeric strings (e.g., `STU-YYYY-XXXX` or standard university matriculation number), strictly unique per student. | *Provide the official university student ID format or regex pattern so import validation can enforce it.* |
| **A-02** | **University Structure** | The hierarchy is structured as: `University -> Academic Year -> Semester -> Faculty -> Department -> Class Cohort -> Student`. | *Confirm whether departments have direct standalone programs or if multi-degree/dual-major students exist within the institution.* |
| **A-03** | **Official Nomenclature** | Default faculty and committee names are left unpopulated until the Administrator enters the university's authentic catalog via the system setup wizard or CSV bulk import. | *Confirm whether pre-seeding standard faculties (e.g., Engineering, Medicine, Business, Education, Law) is preferred for development testing.* |

---

## 3. Governance, Privacy & Representative Transparency

| # | Domain Policy | Baseline Assumption in Blueprint | Council Decision Required |
|---|---|---|---|
| **G-01** | **Representative Contact Details** | Student representatives can display a photo, short biography, faculty role, office hours, and official contact links (Email, Phone, WhatsApp). Personal phone numbers are masked or published only upon explicit representative consent. | *Confirm whether the council provides official representative email accounts or phone extensions, or if verified personal numbers are utilized.* |
| **G-02** | **Welfare & Hardship Privacy** | Hardship applications (`support_cases`) are accessible solely to the designated Welfare Committee Chair and Council President. Faculty presidents and general council members are blocked from viewing welfare applicant identities. | *Confirm whether university financial aid / student affairs administration has an oversight role in the welfare approval process.* |
| **G-03** | **Unpaid Student Status Display** | The application **never** displays public lists of students with unpaid contributions. Only the individual student and authorized finance officers can see personal outstanding amounts. | *Confirm council agreement that no public "name-and-shame" or delinquent student rosters will ever be generated.* |

---

## 4. Action Items for Council Stakeholders

1. **Review and sign off on:**
   - Dual-approval dollar threshold ($500.00 baseline).
   - Official institutional student ID format rules.
   - Welfare committee access protocol.
2. **Provide:**
   - Official university faculty & department list (for seed/migration validation).
   - Standard academic calendar dates for the active academic year.
