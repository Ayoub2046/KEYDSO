# KEYDSO MAANTA — Application Security Architecture & STRIDE Threat Model
**Document Version:** 1.0.0  
**Security Standard:** Aligned with OWASP ASVS v4.0 Level 2 & OWASP Top 10 (2021/2025)  
**Security Lead:** Senior Application Security Engineer

---

## 1. Security Philosophy & Architecture Overview

Keydso Maanta manages student financial contributions, welfare cases, and representative governance. A breach could result in financial embezzlement, student harassment (e.g. exposure of students in financial distress), or loss of institutional legitimacy.

Security is implemented in **defense-in-depth layers**:
1. **Network Layer:** Strict TLS 1.3, CSP, HSTS, Rate Limiting.
2. **Gateway/Application Layer:** Strict JWT validation, Role + Attribute-Based Access Control, Input Sanitization (Zod), Idempotency guards.
3. **Database Layer:** Row Level Security (RLS) on PostgreSQL, Immutable Ledger triggers, Check constraints.
4. **Storage Layer:** Private Supabase Buckets, Short-lived HMAC signed URLs (15-min TTL), MIME-type verification by file magic bytes.

---

## 2. STRIDE Threat Analysis Matrix

| Threat Category | Target Asset / Endpoint | Threat Scenario | Concrete Countermeasure & Implementation |
|---|---|---|---|
| **Spoofing** | Auth API (`/api/v1/auth/login`) | Attacker brute forces student or officer credentials; steals JWT from browser. | - Argon2id password hashing.<br>- IP + Account rate limiting (5 failed attempts = 15-min lockout).<br>- HttpOnly, Secure, SameSite=Strict cookies.<br>- Session invalidation on password change. |
| **Tampering** | Payments (`/api/v1/payments`) | User modifies amount or status parameter in transit to mark unpaid dues as settled. | - Strict backend DTO validation with Zod.<br>- Status transitions locked by state machine.<br>- Amounts calculated server-side; client input ignored for balances. |
| **Repudiation** | Financial Disbursals (`/expenses`) | An officer approves an expense and later denies authorizing it. | - Immutable `audit_logs` table records actor ID, timestamp, IP, user-agent, prior state, and new state.<br>- Disbursal receipts carry HMAC-SHA256 signature hashes. |
| **Information Disclosure** | Student Welfare (`/welfare`) | Unauthorized student or faculty views sensitive hardship reasons of classmates. | - Attribute-Based Access Control (ABAC): Only assigned Welfare Reviewers and Council President can query `support_cases`.<br>- Aggregated financial reports scrub individual identifiers.<br>- Row Level Security policy: `user_id = auth.uid()` or role in `('WELFARE_COMMITTEE', 'PRESIDENT')`. |
| **Denial of Service** | Bulk Import (`/students/import`) | Attacker uploads a 500MB malformed CSV to crash the Node.js event loop or exhaust memory. | - Max payload size constrained to 10MB.<br>- Streaming CSV parser with row-by-row memory bounding.<br>- Execution in background worker job. |
| **Elevation of Privilege** | Faculty Workspace (`/faculties/:id`) | Faculty President of Arts crafts an API request to approve meetings or challenges in Faculty of Medicine. | - `FacultyScopeGuard` verifies `faculty_id` matches the user's active `faculty_assignments`.<br>- PostgreSQL RLS enforces tenant separation at the database engine level. |

---

## 3. OWASP Top 10 Mitigation Blueprint

### A01: Broken Access Control
- **Mitigation:** Zero trust in client-supplied role claims. Every protected route resolves permissions against the database-backed role assignments on every request or through short-lived cryptographically signed tokens refreshed via server verification.
- **Cross-Faculty Boundary:** Explicit check on every `/api/v1/faculties/:facultyId/*` path ensuring the authenticated user owns that specific scope.

### A02: Cryptographic Failures
- Passwords hashed using `Argon2id` (memory cost 64MB, 3 iterations, 4 parallelism).
- Sensitive evidence stored in private buckets with Server-Side Encryption (AES-256).
- Receipt verification hashes computed using `HMAC-SHA256` with rotating server key.

### A03: Injection (SQL & NoSQL)
- Parameterized queries exclusively via PostgreSQL client/ORM.
- Strict type assertions with Zod on all dynamic filter parameters.
- Disallow raw SQL string concatenation across the codebase.

### A04: Insecure Design
- Segregation of duties built into the financial core: A user cannot create and approve their own payment or expense.
- Two-tier approval required for any transaction above the institutional threshold.

### A05: Security Misconfiguration
- Helmet middleware enabled with strict Content Security Policy (CSP):
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co;
  ```
- Detailed stack traces disabled in production (`NODE_ENV === 'production'`).
- Generic error messages returned to clients; details sent to internal secure logger.

### A06: Vulnerable and Outdated Components
- Automated dependency auditing via `npm audit` in CI/CD pipeline.
- Snyk / Dependabot active on repository.

### A07: Identification and Authentication Failures
- Multi-Factor Authentication (MFA) capability for Administrative and Finance roles.
- Timing-attack safe credential comparison (`crypto.timingSafeEqual`).
- Password reset tokens expire in 15 minutes, single-use with cryptographic randomness.

### A08: Software and Data Integrity Failures
- Signed commits in git repository.
- File uploads checked for magic bytes (signature matching `image/png`, `image/jpeg`, `application/pdf`), rejecting files based purely on `.ext` extension.

### A09: Security Logging and Monitoring Failures
- Structured JSON logging with Winston / Pino.
- Log events for: Failed logins, privilege escalations, financial adjustments, reversals, export downloads.
- Logs written to append-only tables; immutable via SQL triggers.

### A10: Server-Side Request Forgery (SSRF)
- Webhooks and external integration URLs validated against an IP allowlist.
- Private RFC 1918 / localhost IP addresses blocked from outbound HTTP calls.

---

## 4. Student Data Privacy & Ethical Governance

1. **No "Name-and-Shame" Walls:** Public dashboards NEVER display lists of students who have outstanding or overdue balances. Only aggregated statistics (e.g. "82% Collected for Faculty of Science") are viewable.
2. **Confidential Hardship:** Welfare applications (`support_cases`) are quarantined. Even general council members cannot view applicant identities or hardship statements without explicit welfare committee clearance.
3. **Representative Contact Safeguards:** Faculty representatives must opt-in to public phone/WhatsApp links, or use institutional email addresses to prevent personal privacy violations.
4. **FERPA / GDPR Compliance:**
   - Right to audit: Students can download a full export of their personal financial records and activity logs.
   - Data minimization: Only academic affiliation and institutional ID collected; no sensitive personal demographic data without justification.
