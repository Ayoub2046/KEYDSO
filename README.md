# KEYDSO MAANTA (University Student Representative Council Management System)
> *"Every Contribution Matters. Every Action Is Accountable."*

[![CI/CD Pipeline](https://github.com/keydso-maanta/keydso-core/actions/workflows/ci.yml/badge.svg)](https://github.com/keydso-maanta/keydso-core/actions/workflows/ci.yml)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. System Overview

**Keydso Maanta** is a production-grade, secure, scalable, and auditable Progressive Web Application (PWA) designed for university student representative councils, finance committees, faculty representatives, and university student bodies.

The system addresses five fundamental governance and transparency questions:
1. **Who represents each student?** Direct lookup of assigned faculty and council representatives with office hours and verified contacts.
2. **How much money has been collected from students?** Real-time aggregation of fixed and voluntary contribution campaigns with zero mockup values.
3. **What was the collected money used for?** Public spending transparency feed with itemized procurement purposes, presidential sign-offs, and attached invoices.
4. **What activities are the council and committees performing?** Governance task tracking, meeting proposals, certified meeting minutes, and assembly attendance.
5. **What results have the representatives delivered?** Faculty challenge tracking from submission through investigation to verified resolution.

---

## 2. Technology Stack

### Frontend Application (`apps/web`)
- **Framework:** React 18 with TypeScript 5.4
- **Tooling:** Vite 5 with `vite-plugin-pwa` (Workbox Service Worker, Web App Manifest)
- **Styling:** Tailwind CSS with Lucide React iconography
- **State & Data Fetching:** TanStack React Query v5 & Zustand
- **Form Handling:** React Hook Form with Zod schema validation
- **Visualizations:** Recharts responsive charts (Cashflow trends, obligation coverage, faculty composite score, committee task completion)

### Backend API Service (`apps/api`)
- **Runtime:** Node.js 20 with TypeScript & Express.js modular monolith architecture
- **Authentication:** JWT (JSON Web Tokens) with secure HTTP headers and secret isolation
- **Authorization:** Role-Based Access Control (RBAC) with 9 configurable roles and cross-faculty isolation guards
- **Validation:** Server-side Zod validation on 100% of mutation and query payloads
- **Security:** Helmet CSP security headers, CORS origin enforcement, and `express-rate-limit` DDoS/brute-force protection
- **Database Engine:** Dual-mode PostgreSQL / in-memory client for instant local testing and production deployment
- **Audit Engine:** Immutable audit trail logging actors, IP addresses, entity mutations, and cryptographic HMAC-SHA256 signatures

### Shared Workspace Packages
- `packages/shared-types`: Unified TypeScript interfaces and domain models
- `packages/validation`: Unified Zod schemas shared across client and server

---

## 3. Monorepo Architecture & Directory Structure

```text
keeydso-maanta/
├── .github/
│   └── workflows/
│       └── ci.yml                 # Automated CI: Typecheck, 125 Vitest tests, PWA build
├── apps/
│   ├── api/                       # Modular Express TypeScript REST API
│   │   ├── src/
│   │   │   ├── common/            # Config, logger, errors, crypto HMAC, responses
│   │   │   ├── database/          # Dual-mode DB, seed data, audit logging
│   │   │   ├── middleware/        # Auth, RBAC, faculty boundaries
│   │   │   ├── modules/           # Auth, Academic, Students, Portal, Finance, Governance, Reports, Notifications
│   │   │   ├── security/          # Auth guards, role guards, faculty isolation
│   │   │   ├── app.ts             # Express setup, Helmet, Rate limiting, Error handlers
│   │   │   └── server.ts          # HTTP server bootstrap
│   │   └── tests/                 # 9 test suites (125 automated integration tests)
│   └── web/                       # React 18 PWA Vite Frontend
│       ├── public/                # Web manifest assets & PWA SVG icon
│       ├── src/
│       │   ├── components/        # Layout, Navbar, Sidebar, NotificationCenter
│       │   ├── features/          # Portal, Finance, Governance, Reports, Admin, Students
│       │   ├── routes/            # Protected routes with role guards
│       │   ├── services/          # Strongly typed API client
│       │   ├── store/             # Zustand auth store
│       │   ├── App.tsx            # Full routing matrix
│       │   └── main.tsx           # React bootstrap with PWA service worker registration
├── database/
│   └── migrations/                # 5 Production SQL migrations (PostgreSQL / Supabase)
│       ├── 001_initial_schema.sql
│       ├── 002_seed_initial_data.sql
│       ├── 003_announcements_and_feedback.sql
│       ├── 004_meetings_and_governance.sql
│       └── 005_notifications.sql
├── docs/                          # Comprehensive technical documentation
│   ├── ARCHITECTURE.md            # System architecture and data flow
│   ├── DATABASE.md                # 32-table database schema and RLS policies
│   ├── ERD.md                     # Entity-relationship diagrams
│   ├── FINANCIAL_WORKFLOW.md      # Four-eyes intake and double-entry general ledger
│   ├── ROLE_PERMISSION_MATRIX.md  # 9-role permission authorization matrix
│   ├── SECURITY_THREAT_MODEL.md   # OWASP ASVS threat mitigation
│   ├── ROADMAP.md                 # 8-phase execution roadmap
│   └── USER_MANUAL.md             # Operational user guides for all council roles
├── packages/
│   ├── shared-types/              # Shared TypeScript definitions
│   └── validation/                # Shared Zod validation schemas
├── scripts/
│   ├── migrate.ts                 # Production PostgreSQL migration runner
│   └── backup.ts                  # Disaster recovery & point-in-time audit drill
├── .env.example                   # Environment configuration template
└── package.json                   # NPM workspaces configuration
```

---

## 4. Security Principles & Architecture

1. **Mandatory Four-Eyes Verification:** A finance officer who records a payment cannot verify it. A second distinct officer must inspect external statements before verifying, preventing internal embezzlement.
2. **Double-Entry General Ledger:** Verifying a payment automatically creates an immutable `CREDIT` entry in the General Ledger. Expense disbursements create `DEBIT` entries. Physical database deletions are disabled. Reversals require auditable contra-entries.
3. **Cryptographic Digital Receipts:** Every verified payment issues an HMAC-SHA256 digital signature seal (`REC-YYYY-XXXX`) that students and auditors can independently verify against tampering.
4. **Cross-Faculty Isolation:** Faculty Presidents and representatives are cryptographically and logically isolated to their assigned faculty workspace (`user.assigned_faculty_id`).
5. **Confidential Student Hardship Segregation:** Student welfare support cases (medical, food security, emergency subsidies) are strictly confidential and segregated from public transparency feeds.
6. **Zero Name-and-Shame Debtor Lists:** Outstanding balances are visible only to the individual student and authorized finance officers. Public feeds display only aggregated totals.

---

## 5. Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 15+ (optional for local development; system includes an automated in-memory client)

### Installation
```bash
# Clone the repository
git clone https://github.com/keydso-maanta/keydso-core.git
cd keydso-core

# Install all monorepo dependencies
npm install

# Build shared packages
npm run build --workspace=packages/shared-types
npm run build --workspace=packages/validation
```

### Running the Test Suite
```bash
# Run all 9 integration test suites (125 tests)
npm test --workspace=apps/api
```

### Running the Development Environment
```bash
# Start backend API (runs on http://localhost:4000)
npm run dev --workspace=apps/api

# In a separate terminal, start frontend PWA (runs on http://localhost:5173)
npm run dev --workspace=apps/web
```

### Building for Production
```bash
# Build frontend PWA bundle with service worker and manifest
npm run build --workspace=apps/web

# Build backend API
npm run build --workspace=apps/api
```

---

## 6. Default Demonstration Accounts

| Role | Email Address | Password | Permissions & Workspace Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@keydso.university.edu` | `AdminPass123!` | Full system configuration, bulk import, audit logs |
| **General President** | `president@keydso.university.edu` | `AdminPass123!` | Executive hub, meeting reviews, high-value expense sign-offs |
| **Council Secretary** | `secretary@keydso.university.edu` | `AdminPass123!` | Secretarial records, certified meeting minutes |
| **Finance Officer A** | `finance.a@keydso.university.edu` | `AdminPass123!` | Records payments (Maker in Four-Eyes protocol) |
| **Finance Officer B** | `finance.b@keydso.university.edu` | `AdminPass123!` | Verifies payments (Checker in Four-Eyes protocol) |
| **CSIT Faculty Rep** | `csit.rep@keydso.university.edu` | `AdminPass123!` | CSIT faculty workspace, forums, challenges |
| **Eng Faculty Rep** | `eng.rep@keydso.university.edu` | `AdminPass123!` | Engineering faculty workspace, welfare committee chair |
| **Student (Demo)** | `student.demo@keydso.university.edu` | `StudentPass123!` | Personal portal, contributions, digital receipts |

---

## 7. Database Migrations & Production Deployment

To run migrations against a live PostgreSQL or Supabase instance:
```bash
# Set your production database connection string
export DATABASE_URL="postgresql://postgres:yourpassword@db.supabase.co:5432/postgres"

# Execute the migration runner
npx tsx scripts/migrate.ts
```

To run a disaster recovery and point-in-time backup verification drill:
```bash
npx tsx scripts/backup.ts
```

---

## 8. License
Released under the MIT License. Copyright © 2026 Student Representative Council. All rights reserved.
