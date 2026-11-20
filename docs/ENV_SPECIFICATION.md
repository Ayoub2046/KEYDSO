# KEYDSO MAANTA — Environment Variables & Secrets Specification
**Document Version:** 1.0.0  
**Security Classification:** Strict Confidentiality for Production Secrets

---

## 1. Security Architecture & Boundary Rules

1. **Strict Client-Server Isolation:**
   - Secrets prefixed with `VITE_` are bundled into the public client application.
   - **NEVER** place database credentials, JWT secret keys, service-role tokens, SMTP passwords, or storage service keys in `VITE_` variables.
   - Only public configuration (API base URL, public Supabase anon key, app title) may exist in the frontend environment.
2. **Secrets Storage:**
   - Development: Local `.env` files added to `.gitignore`.
   - Production: Managed secret vaults (e.g. Supabase Vault, Doppler, AWS Secrets Manager, or Hosting Environment Secrets).
3. **Audit Rule:** Continuous integration pipeline automatically scans commits to prevent accidental credentials leakage.

---

## 2. Backend Environment Variables (`apps/api/.env`)

| Variable Name | Required | Sensitivity | Default / Example | Purpose & Description |
|---|:---:|:---:|---|---|
| `NODE_ENV` | Yes | Low | `development` / `production` | Runtime mode. Controls stack traces, logging levels, and cookie security flags. |
| `PORT` | Yes | Low | `4000` | HTTP port on which the backend Express/NestJS service listens. |
| `DATABASE_URL` | Yes | **CRITICAL** | `postgresql://postgres:pass@host:5432/postgres?sslmode=require` | PostgreSQL direct connection string for Prisma/TypeORM/migration runner. |
| `SUPABASE_URL` | Yes | Medium | `https://xxxx.supabase.co` | Supabase project API gateway endpoint. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **CRITICAL** | `eyJhbGciOi...` | Supabase privileged service-role key for backend administrative operations and storage bypass. |
| `JWT_SECRET` | Yes | **CRITICAL** | `min-64-character-cryptographically-random-string` | Secret key used to sign and verify session tokens (HMAC-SHA512). |
| `JWT_EXPIRES_IN` | Yes | Low | `1h` | Expiration time for access tokens. |
| `REFRESH_TOKEN_SECRET` | Yes | **CRITICAL** | `min-64-character-cryptographically-random-string` | Secret key used to sign refresh tokens. |
| `REFRESH_TOKEN_EXPIRES_IN` | Yes | Low | `7d` | Expiration time for refresh tokens. |
| `STORAGE_BUCKET_PRIVATE` | Yes | Low | `keydso-private-evidence` | Supabase private storage bucket name for invoices, receipts, and welfare documents. |
| `CORS_ORIGIN` | Yes | Medium | `https://keydso.university.edu` | Allowed origins for Cross-Origin Resource Sharing. Disallow wildcard `*` in production. |
| `RECEIPT_HMAC_SECRET` | Yes | **CRITICAL** | `random-32-byte-hex-key` | Cryptographic secret used to generate verifiable HMAC hashes for receipts. |
| `EXPENSE_DUAL_APPROVAL_THRESHOLD`| No | Medium | `500.00` | Currency amount above which presidential + finance dual sign-off is mandatory. |
| `SMTP_HOST` | No | Medium | `smtp.mailgun.org` | Outgoing email server host for official notifications. |
| `SMTP_PORT` | No | Low | `587` | Outgoing SMTP port. |
| `SMTP_USER` | No | High | `postmaster@mg.university.edu` | SMTP username. |
| `SMTP_PASSWORD` | No | **CRITICAL** | `super-secret-smtp-password` | SMTP password. |
| `SMTP_FROM` | No | Low | `"Keydso Maanta SRC" <noreply@src.university.edu>` | Sender email header. |
| `VAPID_PUBLIC_KEY` | No | Low | `BEl62...` | Web push public key for PWA push alerts. |
| `VAPID_PRIVATE_KEY` | No | **CRITICAL** | `priv-key...` | Web push private key for signing push notifications. |
| `VAPID_SUBJECT` | No | Low | `mailto:admin@src.university.edu` | Contact subject for web push notifications. |

---

## 3. Frontend Environment Variables (`apps/web/.env`)

> [!WARNING]
> Everything in `apps/web/.env` is baked into the browser bundle and is publicly inspectable. Never expose sensitive credentials here.

| Variable Name | Required | Sensitivity | Default / Example | Purpose & Description |
|---|:---:|:---:|---|---|
| `VITE_API_BASE_URL` | Yes | Public | `https://api.keydso.university.edu/api/v1` | Base URL of the backend REST API. |
| `VITE_SUPABASE_URL` | Yes | Public | `https://xxxx.supabase.co` | Supabase URL for public avatar downloads or anon authentication. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public (Restricted by RLS) | `eyJhbGciOi...anon-key` | Public client key governed strictly by PostgreSQL Row Level Security. |
| `VITE_APP_TITLE` | No | Public | `Keydso Maanta - University SRC Management` | App header title. |
| `VITE_ENABLE_PWA_SERVICE_WORKER` | No | Public | `true` | Feature flag to enable/disable Workbox service worker in dev/staging. |
| `VITE_MAX_UPLOAD_SIZE_MB` | No | Public | `10` | Client-side file size guard for evidence uploads before transmission. |
