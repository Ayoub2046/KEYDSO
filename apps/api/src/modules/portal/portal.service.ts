import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import {
  Student,
  RepresentativeInfo,
  StudentCampaignSummary,
  StudentReceipt,
  StudentPortalOverview,
  PublicExpenseSummary,
  Announcement,
} from '@keydso/shared-types';
import { StudentFeedbackInput } from '@keydso/validation';

export class PortalService {
  private resolveStudentForUser(userId: string): Student {
    if (db instanceof InMemoryDatabase) {
      const user = db.profiles.find((p) => p.id === userId);
      if (!user) throw new NotFoundError('User profile not found');

      // If user has a linked student_id
      let student = db.students.find((s) => s.id === user.student_id || s.email === user.email);

      // If not linked by ID/email, fallback to demo student or first student for demo
      if (!student && db.students.length > 0) {
        student = db.students[0];
      }

      if (!student) throw new NotFoundError('No enrolled student record associated with this account');

      const fac = db.faculties.find((f) => f.id === student.faculty_id);
      const dept = db.departments.find((d) => d.id === student.department_id);
      const cls = db.classes.find((c) => c.id === student.class_id);

      return {
        ...student,
        faculty_name: fac?.name,
        department_name: dept?.name,
        class_name: cls?.name,
      };
    }

    throw new Error('Database client method implemented in Postgres branch');
  }

  public async getPortalOverview(userId: string): Promise<StudentPortalOverview> {
    if (db instanceof InMemoryDatabase) {
      const student = this.resolveStudentForUser(userId);

      // Fetch student obligations
      const studentObligations = db.obligations.filter((o) => o.student_id === student.id);
      let totalExpected = 0;
      let totalPaid = 0;
      let totalRemaining = 0;

      const campaigns: StudentCampaignSummary[] = studentObligations.map((obl) => {
        const camp = db.campaigns.find((c) => c.id === obl.campaign_id);
        const payments = db.payments
          .filter((p) => p.student_id === student.id && p.campaign_id === obl.campaign_id)
          .map((p) => ({
            id: p.id,
            transaction_reference: p.transaction_reference,
            amount: parseFloat(p.amount),
            payment_method: p.payment_method,
            payment_date: p.payment_date,
            status: p.status,
            receipt_number: p.receipt_number,
            campaign_title: camp?.title || 'Student Campaign',
            verification_date: p.verification_date,
          }));

        const exp = parseFloat(obl.expected_amount);
        const paid = parseFloat(obl.verified_paid_amount);
        const waived = parseFloat(obl.waived_amount || '0');
        const sponsored = parseFloat(obl.sponsored_amount || '0');
        const rem = Math.max(0, exp - (paid + waived + sponsored));

        totalExpected += exp;
        totalPaid += paid;
        totalRemaining += rem;

        return {
          campaign_id: obl.campaign_id,
          campaign_title: camp?.title || 'Contribution Campaign',
          campaign_purpose: camp?.purpose || 'Council program',
          campaign_type: camp?.campaign_type || 'FIXED_PER_STUDENT',
          expected_amount: exp,
          verified_paid_amount: paid,
          waived_amount: waived,
          sponsored_amount: sponsored,
          remaining_balance: rem,
          status: obl.status,
          due_date: camp?.end_date || '2026-06-30',
          payments,
        };
      });

      // Receipts
      const recentReceipts: StudentReceipt[] = db.receipts
        .filter((r) => r.student_id_number === student.student_id_number)
        .map((r) => {
          const pay = db.payments.find((p) => p.id === r.payment_id);
          const issuer = db.profiles.find((p) => p.id === r.issued_by);
          return {
            id: r.id,
            payment_id: r.payment_id,
            receipt_number: r.receipt_number,
            student_name: r.student_name,
            student_id_number: r.student_id_number,
            amount: parseFloat(r.amount),
            campaign_title: r.campaign_title,
            payment_method: pay?.payment_method || 'CASH',
            issued_at: r.issued_at,
            issued_by_name: issuer?.full_name || 'Finance Officer',
            signature_hash: r.signature_hash,
          };
        });

      // Representatives for this student
      const reps = await this.getRepresentatives(student.faculty_id);

      return {
        student,
        total_expected: totalExpected,
        total_paid: totalPaid,
        total_remaining: totalRemaining,
        overall_status: totalRemaining === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'DUE',
        campaigns,
        recent_receipts: recentReceipts,
        representatives: reps,
        announcements: [...db.announcements],
      };
    }

    throw new Error('Not implemented for real db in this branch');
  }

  public async getRepresentatives(facultyId?: string): Promise<RepresentativeInfo[]> {
    if (db instanceof InMemoryDatabase) {
      const results: RepresentativeInfo[] = [];

      // 1. General President
      const genPres = db.profiles.find((p) => p.email === 'president@keydso.university.edu');
      if (genPres) {
        results.push({
          id: genPres.id,
          full_name: genPres.full_name,
          role_title: 'General Council President',
          contact_number: genPres.contact_number,
          email: genPres.email,
          bio: genPres.bio,
          whatsapp_number: genPres.contact_number?.replace(/[^0-9]/g, ''),
          office_hours: 'Monday – Thursday, 10:00 AM – 2:00 PM',
        });
      }

      // 2. Assigned Faculty President
      if (facultyId) {
        const facAssign = db.facultyAssignments.find((fa) => fa.faculty_id === facultyId && fa.is_active);
        if (facAssign) {
          const repUser = db.profiles.find((p) => p.id === facAssign.user_id);
          const faculty = db.faculties.find((f) => f.id === facultyId);
          if (repUser) {
            results.push({
              id: repUser.id,
              full_name: repUser.full_name,
              role_title: `Faculty President (${faculty?.code || 'Faculty'})`,
              faculty_name: faculty?.name,
              contact_number: repUser.contact_number,
              email: repUser.email,
              bio: repUser.bio,
              whatsapp_number: repUser.contact_number?.replace(/[^0-9]/g, ''),
              office_hours: 'Tuesday & Thursday, 1:00 PM – 4:00 PM',
            });
          }
        }
      }

      return results;
    }
    return [];
  }

  public async getReceiptByNumber(receiptNumber: string, userId: string): Promise<StudentReceipt> {
    if (db instanceof InMemoryDatabase) {
      const student = this.resolveStudentForUser(userId);
      const receipt = db.receipts.find((r) => r.receipt_number === receiptNumber);
      if (!receipt) throw new NotFoundError(`Receipt #${receiptNumber} not found`);

      // IDOR Security Check: Must belong to current student
      if (receipt.student_id_number !== student.student_id_number) {
        throw new ForbiddenError('Access Denied: You are not authorized to view this receipt.');
      }

      const pay = db.payments.find((p) => p.id === receipt.payment_id);
      const issuer = db.profiles.find((p) => p.id === receipt.issued_by);

      return {
        id: receipt.id,
        payment_id: receipt.payment_id,
        receipt_number: receipt.receipt_number,
        student_name: receipt.student_name,
        student_id_number: receipt.student_id_number,
        amount: parseFloat(receipt.amount),
        campaign_title: receipt.campaign_title,
        payment_method: pay?.payment_method || 'CASH',
        issued_at: receipt.issued_at,
        issued_by_name: issuer?.full_name || 'Finance Secretariat',
        signature_hash: receipt.signature_hash,
      };
    }

    throw new Error('Not implemented for real db in this branch');
  }

  public async submitFeedback(input: StudentFeedbackInput, userId: string) {
    if (db instanceof InMemoryDatabase) {
      const student = this.resolveStudentForUser(userId);

      const refNum = `ISSUE-${new Date().getFullYear()}-${String(db.issueReports.length + 1).padStart(4, '0')}`;
      const issue = {
        id: crypto.randomUUID(),
        reference_number: refNum,
        faculty_id: input.faculty_id || student.faculty_id,
        department_id: input.department_id || student.department_id,
        reported_by: userId,
        category: input.category,
        priority: input.priority,
        title: input.title,
        description: input.description,
        status: 'SUBMITTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.issueReports.push(issue);

      await recordAudit({
        actor_id: userId,
        action: 'SUBMIT_STUDENT_FEEDBACK',
        entity_type: 'ISSUE_REPORT',
        entity_id: issue.id,
        new_state: issue,
      });

      return issue;
    }
    throw new Error('Not implemented');
  }

  public async getPublicTransparencyFeed(): Promise<PublicExpenseSummary[]> {
    if (db instanceof InMemoryDatabase) {
      return db.expenses
        .filter((e) => e.is_public_summary_published)
        .map((e) => {
          const camp = db.campaigns.find((c) => c.id === e.campaign_id);
          const pres = db.profiles.find((p) => p.id === e.approved_by_president_id);
          const evidence = db.evidenceFiles
            .filter((ef) => ef.entity_type === 'EXPENSE' && ef.entity_id === e.id)
            .map((ef) => ({
              file_name: ef.file_name,
              file_path: ef.file_path,
              mime_type: ef.mime_type,
            }));

          return {
            id: e.id,
            campaign_title: camp?.title || 'Student Council Campaign',
            expense_title: e.title,
            purpose: e.purpose,
            vendor_name: e.vendor_name,
            amount: parseFloat(e.approved_amount || e.requested_amount),
            disbursed_at: e.disbursed_at || e.updated_at,
            approver_name: pres?.full_name || 'Council President',
            evidence_files: evidence,
          };
        });
    }
    return [];
  }

  public async getAnnouncements(): Promise<Announcement[]> {
    if (db instanceof InMemoryDatabase) {
      return [...db.announcements];
    }
    return [];
  }
}

export const portalService = new PortalService();
