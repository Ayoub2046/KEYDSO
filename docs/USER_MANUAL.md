# KEYDSO MAANTA — OPERATIONAL USER MANUALS
*"Every Contribution Matters. Every Action Is Accountable."*

---

## 1. System Administrator Operations Manual

### Mandate
The System Administrator possesses full system configuration authority, user management, and institution-wide audit log oversight. The Administrator is responsible for maintaining academic structural integrity without bypassing financial segregation-of-duties controls.

### Core Workflows

#### 1.1 Managing the Academic Hierarchy
1. Navigate to **Administration $\rightarrow$ Academic Hierarchy** (`/admin/academic`).
2. **Academic Years:** Create the new academic year (e.g., `2025/2026`) specifying start and end dates. Activate the current year. Only one academic year can be active at any given moment.
3. **Semesters:** Register semesters under the active academic year (e.g., `Semester 1`, `Semester 2`).
4. **Faculties & Departments:** Register new faculties with unique codes (e.g., `CSIT`, `ENG`, `MED`, `LAW`, `BIZ`). Create departments under each respective faculty.
5. **Class Cohorts:** Group students into specific classes and cohorts (e.g., `CS Class of 2026 (Year 3)`).

#### 1.2 User Accounts & Role-Based Access Control (RBAC)
1. Navigate to **Administration $\rightarrow$ Users & Roles** (`/admin/users`).
2. Register staff and council profiles with institutional email addresses.
3. Assign granular roles:
   - `SYSTEM_ADMIN`: Technical and system configuration.
   - `GENERAL_PRESIDENT` & `VICE_PRESIDENT`: Executive council authority and proposal review.
   - `FINANCE_OFFICER`: Treasury intake, verification, and ledger reconciliations.
   - `SECRETARY`: Secretarial record-keeping and meeting minutes certification.
   - `FACULTY_PRESIDENT`: Assigned representative for a specific faculty workspace.
   - `COMMITTEE_CHAIR` & `COMMITTEE_MEMBER`: Committee management and task execution.
   - `STUDENT`: Base role for registered students.

#### 1.3 Bulk Student Enrollment
1. Navigate to **Administration $\rightarrow$ Bulk Student Import** (`/admin/import`).
2. Download the official CSV/XLSX template.
3. Populate required columns: `student_id_number`, `full_name`, `faculty_code`, `department_code`, `email`, `contact_number`.
4. Upload the spreadsheet to perform an automated **Dry-Run Validation**:
   - System checks for duplicate student IDs, existing emails, and invalid faculty/department codes.
   - If errors exist, download the error report and correct records before committing.
5. Confirm import to register validated students into production tables.

#### 1.4 Reviewing System Audit Logs
1. Navigate to **Administration $\rightarrow$ Audit Logs** (`/admin/audit`).
2. Inspect immutable logs recording actor IDs, IP addresses, entity types, previous states, and new states.
3. Audit logs cannot be modified, cleared, or deleted by any user.

---

## 2. General Council President & Executive Oversight Guide

### Mandate
The General Council President provides institution-wide executive leadership, reviews proposals from faculties and committees, ratifies expenditure authorizations, and monitors council transparency metrics.

### Core Workflows

#### 2.1 Executive Hub & KPIs
1. Navigate to **Council Management $\rightarrow$ Executive Hub** (`/governance/dashboard`).
2. Review institution-wide indicators:
   - Total Students Enrolled across all faculties.
   - Active Contribution Campaigns and collection progress.
   - Net Treasury Fund Balance.
   - Active Committees and outstanding tasks.
   - Open Faculty Challenges requiring executive attention.
   - Scheduled Council Meetings & Assemblies.

#### 2.2 Reviewing & Approving Meeting Proposals
1. Navigate to **Council Management $\rightarrow$ Meetings & Assemblies** (`/governance/meetings`).
2. Filter by status: `REQUESTED`.
3. Open the meeting request to inspect agenda, venue, start/end time, and target audience.
4. Click **Approve Meeting** to authorize scheduling, or **Reject Meeting** providing written feedback for revision.

#### 2.3 Dual Authorization of High-Value Expenditures
1. Navigate to **Finance & Treasury $\rightarrow$ Expenditure Workflow** (`/finance/expenses`).
2. Review expenditure requests submitted by finance officers or faculty representatives.
3. For expenditures exceeding the **Dual-Approval Threshold ($500.00)**:
   - The General President must review vendor quotes, purpose justification, and available fund balance.
   - Ratify approval to unlock fund disbursement.

#### 2.4 Tracking Faculty Challenges
1. Navigate to **Governance $\rightarrow$ Faculty Challenges** (`/governance/challenges`).
2. Monitor challenges submitted by student representatives across all university faculties.
3. Escalate high-priority infrastructure or academic concerns to university administration.

---

## 3. Finance Committee Treasury Operations & Four-Eyes Protocol

### Mandate
The Finance Committee maintains total fiscal integrity, administers student contribution campaigns, enforces the mandatory **Four-Eyes Verification Protocol**, manages the General Ledger, and disburses audited funds.

### Core Workflows

#### 3.1 Creating Contribution Campaigns
1. Navigate to **Finance & Treasury $\rightarrow$ Contribution Campaigns** (`/finance/campaigns`).
2. Click **Create Campaign**:
   - Set Title, Code, Purpose, Target Amount, and Fixed Contribution per Student (e.g., $25.00).
   - Select Scope: `UNIVERSITY_WIDE`, `FACULTY_SPECIFIC`, `DEPARTMENT_SPECIFIC`, or `CLASS_SPECIFIC`.
   - Link to Treasury Fund (e.g., `General Student Council Fund`).
3. Click **Generate Student Obligations** to instantiate individual student contribution records.

#### 3.2 Recording Student Payments (First Eye)
1. Navigate to **Finance & Treasury $\rightarrow$ Payment Intake** (`/finance/record-payment`).
2. Search for the student by University Student ID Number or Full Name.
3. Select the active campaign and enter:
   - Amount paid ($).
   - Payment Method (`MOBILE_MONEY`, `BANK_TRANSFER`, `CASH`, `CREDIT_CARD`).
   - Transaction Reference Number (e.g., EVC Plus or banking slip number).
4. Submit the transaction. The payment status is set to `PENDING`.
   > **Note:** The recording officer **cannot** verify this payment.

#### 3.3 Four-Eyes Payment Verification (Second Eye)
1. Navigate to **Finance & Treasury $\rightarrow$ Verification Queue** (`/finance/verification-queue`).
2. A **second, distinct Finance Officer** reviews pending payments against external bank or mobile money statements.
3. Click **Verify Payment**:
   - System updates payment status to `VERIFIED`.
   - System generates a cryptographically signed digital receipt (`REC-YYYY-XXXX`) with HMAC-SHA256 signature.
   - General Ledger automatically records a balanced `CREDIT` entry to the assigned Treasury Fund.
   - The verified amount is applied to reduce the student's outstanding obligation.
   - In-app notification is automatically dispatched to the student's portal.

#### 3.4 Payment Reversal & Audit Protocol
1. In the event of an erroneous or refunded transaction, locate the verified payment.
2. Click **Reverse Payment** and supply an auditable justification.
3. System marks the payment as `REVERSED` and posts an offsetting `DEBIT` entry in the General Ledger. The student's obligation balance is restored. Deletions are strictly prohibited.

#### 3.5 General Ledger & Audit Exports
1. Navigate to **Finance & Treasury $\rightarrow$ General Ledger** (`/finance/ledger`).
2. Inspect real-time double-entry records with calculated running balances.
3. Navigate to **Reports & Analytics $\rightarrow$ Analytics Dashboard** (`/reports`) to download official CSV reconciliation exports or generate cryptographic audit seals.

---

## 4. Faculty President Workspace & Challenge Tracking Manual

### Mandate
Faculty Presidents represent students within their assigned faculty. They have access to a dedicated Faculty Workspace with strict cross-faculty data isolation: representatives cannot access or modify private records belonging to other faculties.

### Core Workflows

#### 4.1 Faculty Workspace Hub
1. Navigate to **Council Management $\rightarrow$ Faculty Workspace** (`/governance/faculty`).
2. View faculty student count, department lists, and collection rate benchmarks.

#### 4.2 Logging & Managing Faculty Challenges
1. Navigate to **Council Management $\rightarrow$ Faculty Challenges** (`/governance/challenges`).
2. Click **Submit Faculty Challenge**:
   - Select Department (optional) and Category (`ACADEMIC`, `INFRASTRUCTURE`, `WELFARE`, `ADMINISTRATIVE`, `FINANCIAL`, `OTHER`).
   - Set Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Provide detailed description and classroom/lab location.
3. Update progress: Assign challenges to faculty committee members, transition from `SUBMITTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`.
4. Enter auditable **Resolution Notes** upon successful completion.

#### 4.3 Scheduling Faculty Student Forums
1. Navigate to **Council Management $\rightarrow$ Meetings & Assemblies** (`/governance/meetings`).
2. Propose a `FACULTY_MEETING` with planned venue, start/end time, and student agenda.
3. Upon approval by the General President, conduct the session and submit certified attendance counts.

---

## 5. Student Portal Transparency & Digital Receipt Verification Manual

### Mandate
The Student Portal provides every registered student with complete transparency into their council representation, financial obligations, verified payment receipts, and public spending evidence.

### Core Workflows

#### 5.1 Accessing the Student Portal
1. Login with your university email address at `/login`.
2. View your **Portal Dashboard** (`/portal`):
   - Personal profile details, student ID number, faculty, and department.
   - Contribution Overview: Total Expected, Total Paid, and Remaining Balance.
   - Assigned Faculty Representatives with direct contact information.
   - Latest Council Announcements.

#### 5.2 Checking Contribution Status & Receipts
1. Navigate to **Student Portal $\rightarrow$ My Contributions** (`/portal/contributions`).
2. Inspect individual campaign cards showing expected contribution, verified paid amount, and remaining balance.
3. View the **Verified Receipts** table:
   - Click on any receipt number (`REC-YYYY-XXXX`) to open the **Digital Receipt Card**.
   - Inspect the cryptographic verification stamp and SHA-256 signature hash confirming authenticity.
   - Download or print your verified receipt for academic clearance.

#### 5.3 Public Spending Transparency Feed
1. Navigate to **Student Portal $\rightarrow$ Spending Transparency** (`/portal/transparency`).
2. Inspect itemized expenditures funded by student contributions:
   - Vendor name, procurement purpose, disbursed amount, and presidential approval.
   - View attached proof documents (invoices, receipts, delivery notes).

#### 5.4 Offline PWA Usage & Notifications
1. **PWA Installation:** Click **Install App** in Chrome/Edge/Safari to install Keydso Maanta directly onto your mobile home screen or desktop.
2. **Offline Mode:** View previously loaded receipts, representative directories, and announcements even without an active internet connection.
3. **Instant Alerts:** Click the Bell icon in the top navigation bar to view instant notifications for payment verifications, meeting approvals, and council announcements.
