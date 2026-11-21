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
  LandingPageSettings,
} from '@keydso/shared-types';
import { StudentFeedbackInput } from '@keydso/validation';

export class PortalService {
  private async resolveStudentForUserAsync(userId: string): Promise<Student> {
    if (db instanceof InMemoryDatabase) {
      const user = db.profiles.find((p) => p.id === userId);
      if (!user) throw new NotFoundError('User profile not found');

      let student = db.students.find((s) => s.id === user.student_id || s.email === user.email);
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

    // Postgres implementation
    const profRes = await db.query('SELECT * FROM profiles WHERE id = $1', [userId]);
    const user = profRes.rows[0];
    if (!user) throw new NotFoundError('User profile not found');

    let studentRes = await db.query(
      `SELECT s.*, f.name as faculty_name, d.name as department_name, c.name as class_name
       FROM students s
       LEFT JOIN faculties f ON f.id = s.faculty_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1 OR s.email = $2`,
      [user.student_id, user.email]
    );

    if (studentRes.rows.length === 0) {
      studentRes = await db.query(
        `SELECT s.*, f.name as faculty_name, d.name as department_name, c.name as class_name
         FROM students s
         LEFT JOIN faculties f ON f.id = s.faculty_id
         LEFT JOIN departments d ON d.id = s.department_id
         LEFT JOIN classes c ON c.id = s.class_id
         LIMIT 1`
      );
    }

    if (studentRes.rows.length === 0) {
      throw new NotFoundError('No enrolled student record associated with this account');
    }

    return studentRes.rows[0];
  }

  public async getPortalOverview(userId: string): Promise<StudentPortalOverview> {
    if (db instanceof InMemoryDatabase) {
      const student = await this.resolveStudentForUserAsync(userId);
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
        const rem = Math.max(0, exp - paid - waived - sponsored);

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

    // Postgres Branch
    const student = await this.resolveStudentForUserAsync(userId);

    const oblRes = await db.query(
      `SELECT o.*, c.title as campaign_title, c.purpose as campaign_purpose, c.campaign_type, c.end_date as due_date
       FROM contribution_obligations o
       LEFT JOIN contribution_campaigns c ON c.id = o.campaign_id
       WHERE o.student_id = $1`,
      [student.id]
    );

    let totalExpected = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    const campaigns: StudentCampaignSummary[] = [];
    for (const obl of oblRes.rows) {
      const payRes = await db.query(
        `SELECT id, transaction_reference, amount, payment_method, payment_date, status, receipt_number, verification_date
         FROM payments
         WHERE student_id = $1 AND campaign_id = $2`,
        [student.id, obl.campaign_id]
      );

      const exp = parseFloat(obl.expected_amount || '0');
      const paid = parseFloat(obl.verified_paid_amount || '0');
      const waived = parseFloat(obl.waived_amount || '0');
      const sponsored = parseFloat(obl.sponsored_amount || '0');
      const rem = Math.max(0, exp - paid - waived - sponsored);

      totalExpected += exp;
      totalPaid += paid;
      totalRemaining += rem;

      campaigns.push({
        campaign_id: obl.campaign_id,
        campaign_title: obl.campaign_title || 'Contribution Campaign',
        campaign_purpose: obl.campaign_purpose || 'Council program',
        campaign_type: obl.campaign_type || 'FIXED_PER_STUDENT',
        expected_amount: exp,
        verified_paid_amount: paid,
        waived_amount: waived,
        sponsored_amount: sponsored,
        remaining_balance: rem,
        status: obl.status,
        due_date: obl.due_date || '2026-06-30',
        payments: payRes.rows.map((p: any) => ({
          ...p,
          amount: parseFloat(p.amount),
          campaign_title: obl.campaign_title,
        })),
      });
    }

    const recRes = await db.query(
      `SELECT r.*, p.payment_method, pr.full_name as issued_by_name
       FROM receipts r
       LEFT JOIN payments p ON p.id = r.payment_id
       LEFT JOIN profiles pr ON pr.id = r.issued_by
       WHERE r.student_id_number = $1
       ORDER BY r.issued_at DESC`,
      [student.student_id_number]
    );

    const recentReceipts: StudentReceipt[] = recRes.rows.map((r: any) => ({
      id: r.id,
      payment_id: r.payment_id,
      receipt_number: r.receipt_number,
      student_name: r.student_name,
      student_id_number: r.student_id_number,
      amount: parseFloat(r.amount),
      campaign_title: r.campaign_title,
      payment_method: r.payment_method || 'CASH',
      issued_at: r.issued_at,
      issued_by_name: r.issued_by_name || 'Finance Officer',
      signature_hash: r.signature_hash,
    }));

    const reps = await this.getRepresentatives(student.faculty_id);
    const annRes = await db.query('SELECT *, created_at as published_at FROM announcements ORDER BY created_at DESC LIMIT 10');

    return {
      student,
      total_expected: totalExpected,
      total_paid: totalPaid,
      total_remaining: totalRemaining,
      overall_status: totalRemaining === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'DUE',
      campaigns,
      recent_receipts: recentReceipts,
      representatives: reps,
      announcements: annRes.rows,
    };
  }

  public async getRepresentatives(facultyId?: string): Promise<RepresentativeInfo[]> {
    if (db instanceof InMemoryDatabase) {
      const results: RepresentativeInfo[] = [];
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

    // Postgres Branch
    const results: RepresentativeInfo[] = [];
    const presRes = await db.query("SELECT * FROM profiles WHERE email = 'president@keydso.university.edu'");
    if (presRes.rows[0]) {
      const genPres = presRes.rows[0];
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

    if (facultyId) {
      const facRes = await db.query(
        `SELECT pr.*, f.name as faculty_name, f.code as faculty_code
         FROM faculty_assignments fa
         JOIN profiles pr ON pr.id = fa.user_id
         JOIN faculties f ON f.id = fa.faculty_id
         WHERE fa.faculty_id = $1 AND fa.is_active = true`,
        [facultyId]
      );
      if (facRes.rows[0]) {
        const rep = facRes.rows[0];
        results.push({
          id: rep.id,
          full_name: rep.full_name,
          role_title: `Faculty President (${rep.faculty_code || 'Faculty'})`,
          faculty_name: rep.faculty_name,
          contact_number: rep.contact_number,
          email: rep.email,
          bio: rep.bio,
          whatsapp_number: rep.contact_number?.replace(/[^0-9]/g, ''),
          office_hours: 'Tuesday & Thursday, 1:00 PM – 4:00 PM',
        });
      }
    }

    return results;
  }

  public async getReceiptByNumber(receiptNumber: string, userId: string): Promise<StudentReceipt> {
    const student = await this.resolveStudentForUserAsync(userId);

    if (db instanceof InMemoryDatabase) {
      const receipt = db.receipts.find((r) => r.receipt_number === receiptNumber);
      if (!receipt) throw new NotFoundError(`Receipt #${receiptNumber} not found`);

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

    // Postgres Branch
    const recRes = await db.query(
      `SELECT r.*, p.payment_method, pr.full_name as issued_by_name
       FROM receipts r
       LEFT JOIN payments p ON p.id = r.payment_id
       LEFT JOIN profiles pr ON pr.id = r.issued_by
       WHERE r.receipt_number = $1`,
      [receiptNumber]
    );

    const receipt = recRes.rows[0];
    if (!receipt) throw new NotFoundError(`Receipt #${receiptNumber} not found`);

    if (receipt.student_id_number !== student.student_id_number) {
      throw new ForbiddenError('Access Denied: You are not authorized to view this receipt.');
    }

    return {
      id: receipt.id,
      payment_id: receipt.payment_id,
      receipt_number: receipt.receipt_number,
      student_name: receipt.student_name,
      student_id_number: receipt.student_id_number,
      amount: parseFloat(receipt.amount),
      campaign_title: receipt.campaign_title,
      payment_method: receipt.payment_method || 'CASH',
      issued_at: receipt.issued_at,
      issued_by_name: receipt.issued_by_name || 'Finance Secretariat',
      signature_hash: receipt.signature_hash,
    };
  }

  public async submitFeedback(input: StudentFeedbackInput, userId: string) {
    const student = await this.resolveStudentForUserAsync(userId);
    const refNum = `ISSUE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    if (db instanceof InMemoryDatabase) {
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

    // Postgres Branch
    const insertRes = await db.query(
      `INSERT INTO issue_reports (
        id, reference_number, faculty_id, department_id, reported_by,
        category, priority, title, description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        crypto.randomUUID(),
        refNum,
        input.faculty_id || student.faculty_id,
        input.department_id || student.department_id,
        userId,
        input.category,
        input.priority,
        input.title,
        input.description,
        'SUBMITTED',
      ]
    );

    const issue = insertRes.rows[0];

    await recordAudit({
      actor_id: userId,
      action: 'SUBMIT_STUDENT_FEEDBACK',
      entity_type: 'ISSUE_REPORT',
      entity_id: issue.id,
      new_state: issue,
    });

    return issue;
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

    // Postgres Branch
    const expRes = await db.query(
      `SELECT e.*, c.title as campaign_title, pr.full_name as approver_name
       FROM expenses e
       LEFT JOIN contribution_campaigns c ON c.id = e.campaign_id
       LEFT JOIN profiles pr ON pr.id = e.approved_by_president_id
       WHERE e.is_public_summary_published = true
       ORDER BY e.created_at DESC`
    );

    const results: PublicExpenseSummary[] = [];
    for (const e of expRes.rows) {
      const evRes = await db.query(
        `SELECT file_name, file_path, mime_type
         FROM evidence_files
         WHERE entity_type = 'EXPENSE' AND entity_id = $1`,
        [e.id]
      );

      results.push({
        id: e.id,
        campaign_title: e.campaign_title || 'Student Council Campaign',
        expense_title: e.title,
        purpose: e.purpose,
        vendor_name: e.vendor_name,
        amount: parseFloat(e.approved_amount || e.requested_amount || '0'),
        disbursed_at: e.disbursed_at || e.updated_at,
        approver_name: e.approver_name || 'Council President',
        evidence_files: evRes.rows,
      });
    }

    return results;
  }

  public async getAnnouncements(): Promise<Announcement[]> {
    if (db instanceof InMemoryDatabase) {
      return [...db.announcements];
    }
    const res = await db.query('SELECT *, created_at as published_at FROM announcements ORDER BY created_at DESC');
    return res.rows;
  }

  public async getLandingSettings(): Promise<LandingPageSettings> {
    const fallbackSettings: LandingPageSettings = {
      hero_title: 'Keydso Maanta Every Contribution Matters. Every Action Is Accountable.',
      hero_subtitle: 'A modern platform to manages student contributions, representatives, activities and university affairs with full transparency and trust.',
      badge_text: 'University Student Representative Council',
      background_image_url: '/zamzam_hero.jpg',
      background_overlay_opacity: 0.65,
      stat_students_count: '8,450',
      stat_treasury_amount: '8',
      stat_audit_rate: '100%',
      feature_1_title: 'Cryptographic Receipts',
      feature_1_desc: 'Every semester payment generates an HMAC-SHA256 verified digital receipt with an immutable verification code.',
      feature_2_title: 'Public Spending Feed',
      feature_2_desc: 'Council disbursements exceeding $500 require dual executive approval and are immediately published with attached invoices.',
      feature_3_title: 'Direct Student Advocacy',
      feature_3_desc: 'Submit academic or welfare grievances straight to your faculty representative with transparent status tracking.',
      announcement_banner: 'University Student Representative Council',
      updated_at: new Date().toISOString(),
    };

    if (db instanceof InMemoryDatabase) {
      return db.siteSettings?.landing_page || fallbackSettings;
    }

    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          updated_by UUID
        )
      `);

      const res = await db.query('SELECT value FROM site_settings WHERE key = $1', ['landing_page']);
      if (res.rows.length > 0 && res.rows[0].value) {
        return { ...fallbackSettings, ...res.rows[0].value };
      }
    } catch (err) {
      console.error('Failed to load landing settings from DB, using fallback:', err);
    }

    return fallbackSettings;
  }
}

export const portalService = new PortalService();
