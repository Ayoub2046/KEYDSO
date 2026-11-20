# KEYDSO MAANTA — Role & Permission Matrix (RBAC / ABAC)
**Document Version:** 1.0.0  
**Enforcement:** Server-Side Security Middleware + Supabase Row Level Security (RLS)

---

## 1. System Roles Definition

| Role Identifier | Role Label | Scope & Domain Authority |
|---|---|---|
| `SYSTEM_ADMIN` | System Administrator | Institution-wide configuration, user management, academic hierarchy, bulk imports, audit review. **Restricted from single-handed financial disbursement.** |
| `GENERAL_PRESIDENT` | General Council President | Institution-wide council governance, final approval on meetings, training, expenditures, challenges, and public announcements. |
| `VICE_PRESIDENT` | Vice President | Delegated presidential oversight, committee monitoring, performance tracking. |
| `FACULTY_PRESIDENT` | Faculty President | **Strictly scoped to assigned faculty.** Manages faculty reps, challenges, meetings, training requests, and activity logs. |
| `FINANCE_OFFICER` | Finance Committee Officer | Financial campaigns, obligation generation, payment recording, receipt generation, reconciliation, expense drafting. |
| `SECRETARY` | Council Secretariat | Official minutes, resolutions, council correspondence, publication of vetted announcements. |
| `COMMITTEE_CHAIR` | Committee Chairperson | Committee task assignment, activity verification, periodic committee performance reporting. |
| `COMMITTEE_MEMBER` | Committee Member | Task execution, daily activity logging, evidence attachment for assigned tasks. |
| `STUDENT` | University Student | **Self-scope only.** Views personal obligations, payment history, receipts, representatives, public financial summaries, submits challenges. |

---

## 2. Granular Permissions Catalog

```
academic:create_year             academic:manage_structure        student:bulk_import
student:view_directory           student:view_own_profile         student:edit_own_profile
council:manage_committees        council:assign_roles             council:view_audit_logs
meeting:request                  meeting:approve                  meeting:record_minutes
training:request                 training:approve                 training:record_outcomes
challenge:submit                 challenge:review                 challenge:resolve
finance:create_campaign          finance:approve_campaign         finance:record_payment
finance:verify_payment           finance:reverse_payment          finance:reconcile
expense:request                  expense:review                   expense:approve
welfare:submit_case              welfare:review_case              welfare:approve_case
report:view_institution          report:view_faculty_scoped       report:export_financial
announcement:create              announcement:publish             evidence:upload
```

---

## 3. Comprehensive Role-Permission Mapping Matrix

| Permission Key | Admin | Gen. Pres | Vice Pres | Fac. Pres | Finance | Secretary | Chair | Member | Student | Scope Boundary |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Academic Hierarchy Configuration** |  |  |  |  |  |  |  |  |  |  |
| `academic:manage_structure` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Global |
| `student:bulk_import` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Validated CSV/XLSX |
| `student:view_directory` | ✅ | ✅ | ✅ | 🔍 | ✅ | ✅ | 🔍 | ❌ | 🔍 | 🔍 Scoped to assigned faculty/public directory |
| `student:view_own_profile` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `student_id == auth.uid()` |
| **Financial Management** |  |  |  |  |  |  |  |  |  |  |
| `finance:create_campaign` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Finance Committee Only |
| `finance:approve_campaign` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Two-person check if required |
| `finance:record_payment` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Creates PENDING payment |
| `finance:verify_payment` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | **Cannot verify own recorded payment** |
| `finance:reverse_payment` | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Requires dual approval + audit reason |
| `finance:reconcile` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Bank / Cash ledger reconciliation |
| `finance:view_own_obligations`| ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | `student_id == auth.uid()` strictly |
| `finance:view_public_transparency` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Published summaries & verified purchases |
| **Expenditure & Procurement** |  |  |  |  |  |  |  |  |  |  |
| `expense:request` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Requires campaign & fund reference |
| `expense:review` (Finance Check) | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Confirms budget balance exists |
| `expense:approve` | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ VP only if formally delegated |
| `expense:disburse` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Creates debit ledger entry |
| `evidence:upload` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Invoices, receipts, photos |
| **Student Welfare & Hardship** |  |  |  |  |  |  |  |  |  |  |
| `welfare:submit_case` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | Confidential intake |
| `welfare:review_case` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔍 | ❌ | ❌ | Welfare Committee Only |
| `welfare:approve_case` | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Joint Welfare-President Approval |
| **Governance & Faculty Operations**|  |  |  |  |  |  |  |  |  |  |
| `meeting:request` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | Faculty or Committee context |
| `meeting:approve` | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Presidential veto / approval |
| `meeting:record_minutes` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | Bound to approved meeting |
| `training:request` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | Requires curriculum & budget |
| `training:approve` | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Presidential approval |
| `challenge:submit` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | Student or Faculty President |
| `challenge:assign` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Assigns to committee / faculty |
| `challenge:resolve` | ❌ | ✅ | ✅ | 🔍 | ❌ | ❌ | 🔍 | ❌ | ❌ | Assigned owner only |
| **Audit & System Administration** |  |  |  |  |  |  |  |  |  |  |
| `council:view_audit_logs` | ✅ | 🔍 | ❌ | ❌ | 🔍 | ❌ | ❌ | ❌ | ❌ | Full admin; read-only financial audit |
| `council:suspend_user` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Administrative action with log |
| `report:export_financial` | ✅ | ✅ | ❌ | 🔍 | ✅ | ❌ | ❌ | ❌ | ❌ | PDF / XLSX with verified watermark |

*Legend: ✅ = Permitted | ❌ = Forbidden | 🔍 = Permitted with strict attribute scope | ⚠️ = Permitted only under recorded delegation.*

---

## 4. Cross-Faculty Access Prevention Architecture (ABAC Guard)

To prevent horizontal privilege escalation (e.g., Faculty President of Engineering accessing or modifying Medical Faculty records):
1. **API Guard (`FacultyScopeGuard`):**
   ```typescript
   if (user.role === 'FACULTY_PRESIDENT') {
     const assignedFacultyId = await getAssignedFaculty(user.id);
     if (request.params.facultyId !== assignedFacultyId) {
       throw new ForbiddenException('Access Denied: Cross-faculty operation blocked by security policy.');
     }
   }
   ```
2. **PostgreSQL Row Level Security (RLS):**
   ```sql
   CREATE POLICY faculty_president_scoped_access ON issue_reports
     FOR ALL
     USING (
       auth.jwt() ->> 'role' = 'FACULTY_PRESIDENT' 
       AND faculty_id = (SELECT faculty_id FROM faculty_assignments WHERE user_id = auth.uid() AND is_active = true)
     );
   ```
3. **Four-Eyes Financial Control:** A finance officer who creates or records a payment cannot verify or approve it (`recorded_by != verified_by`).
