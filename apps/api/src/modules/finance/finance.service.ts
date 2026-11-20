import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { config } from '../../common/config';
import { generateReceiptHmac } from '../../common/crypto';
import { ConflictError, NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import {
  CreateCampaignInput,
  RecordPaymentInput,
  VerifyPaymentInput,
  ReversePaymentInput,
  CreateExpenseRequestInput,
  ApproveExpenseInput,
  ReconcileExpenseInput,
  CreateWelfareCaseInput,
  CreateWaiverInput,
} from '@keydso/validation';
import { RoleName } from '@keydso/shared-types';

export class FinanceService {
  // ==========================================================================
  // CAMPAIGNS
  // ==========================================================================
  public async getCampaigns(academicYearId?: string) {
    if (db instanceof InMemoryDatabase) {
      let list = academicYearId
        ? db.campaigns.filter((c) => c.academic_year_id === academicYearId)
        : [...db.campaigns];

      return list.map((camp) => {
        const obligations = db.obligations.filter((o) => o.campaign_id === camp.id);
        const payments = db.payments.filter((p) => p.campaign_id === camp.id && p.status === 'VERIFIED');

        const totalExpected = obligations.reduce((acc, curr) => acc + parseFloat(curr.expected_amount || '0'), 0);
        const totalCollected = payments.reduce((acc, curr) => acc + parseFloat(curr.amount || '0'), 0);
        const fund = db.funds.find((f) => f.id === camp.fund_id);

        return {
          ...camp,
          fund_name: fund?.name,
          obligations_count: obligations.length,
          total_expected: totalExpected,
          total_collected: totalCollected,
          collection_rate_percentage: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
        };
      });
    }

    const res = await db.query(`
      SELECT c.*, f.name AS fund_name,
        COUNT(DISTINCT o.id) AS obligations_count,
        COALESCE(SUM(o.expected_amount), 0) AS total_expected,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'VERIFIED'), 0) AS total_collected
      FROM contribution_campaigns c
      JOIN funds f ON f.id = c.fund_id
      LEFT JOIN contribution_obligations o ON o.campaign_id = c.id
      LEFT JOIN payments p ON p.campaign_id = c.id
      GROUP BY c.id, f.name
      ORDER BY c.created_at DESC
    `);
    return res.rows;
  }

  public async createCampaign(input: CreateCampaignInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const exists = db.campaigns.some((c) => c.code.toUpperCase() === input.code.toUpperCase());
      if (exists) throw new ConflictError(`Campaign with code '${input.code}' already exists`);

      const camp = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        status: 'DRAFT',
        responsible_officer_id: actorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.campaigns.push(camp);

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_CAMPAIGN',
        entity_type: 'CAMPAIGN',
        entity_id: camp.id,
        new_state: camp,
      });

      return camp;
    }

    const res = await db.query(
      `INSERT INTO contribution_campaigns (
        title, code, description, purpose, target_amount, contribution_amount,
        campaign_type, scope_type, fund_id, academic_year_id, semester_id,
        start_date, end_date, responsible_officer_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'DRAFT')
      RETURNING *`,
      [
        input.title,
        input.code.toUpperCase(),
        input.description,
        input.purpose,
        input.target_amount,
        input.contribution_amount,
        input.campaign_type,
        input.scope_type,
        input.fund_id,
        input.academic_year_id,
        input.semester_id,
        input.start_date,
        input.end_date,
        actorId,
      ]
    );
    const camp = res.rows[0];
    await recordAudit({
      actor_id: actorId,
      action: 'CREATE_CAMPAIGN',
      entity_type: 'CAMPAIGN',
      entity_id: camp.id,
      new_state: camp,
    });
    return camp;
  }

  public async approveCampaign(campaignId: string, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const camp = db.campaigns.find((c) => c.id === campaignId);
      if (!camp) throw new NotFoundError('Campaign not found');

      camp.status = 'ACTIVE';
      camp.approved_by = actorId;
      camp.updated_at = new Date().toISOString();

      // Automatically generate contribution_obligations for target students
      let eligibleStudents = [...db.students];
      if (camp.scope_type === 'FACULTY' && camp.eligible_faculty_ids?.length > 0) {
        eligibleStudents = eligibleStudents.filter((s) => camp.eligible_faculty_ids.includes(s.faculty_id));
      }

      let generatedCount = 0;
      for (const student of eligibleStudents) {
        const alreadyHasObligation = db.obligations.some(
          (o) => o.student_id === student.id && o.campaign_id === camp.id
        );
        if (!alreadyHasObligation) {
          db.obligations.push({
            id: crypto.randomUUID(),
            student_id: student.id,
            campaign_id: camp.id,
            expected_amount: camp.contribution_amount,
            verified_paid_amount: 0.0,
            waived_amount: 0.0,
            sponsored_amount: 0.0,
            status: 'DUE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          generatedCount++;
        }
      }

      await recordAudit({
        actor_id: actorId,
        action: 'APPROVE_CAMPAIGN',
        entity_type: 'CAMPAIGN',
        entity_id: camp.id,
        new_state: { status: 'ACTIVE', generated_obligations: generatedCount },
      });

      return { campaign: camp, generated_obligations: generatedCount };
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // PAYMENT PROCESSING & FOUR-EYES VERIFICATION
  // ==========================================================================
  public async recordPayment(input: RecordPaymentInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      // Idempotency check
      const existingIdemp = db.payments.find((p) => p.idempotency_key === input.idempotency_key);
      if (existingIdemp) {
        return existingIdemp; // Return idempotent duplicate safely
      }

      // Unique transaction reference check
      const dupRef = db.payments.find((p) => p.transaction_reference === input.transaction_reference);
      if (dupRef) {
        throw new ConflictError(
          `Transaction reference '${input.transaction_reference}' has already been recorded in the system.`
        );
      }

      const campaign = db.campaigns.find((c) => c.id === input.campaign_id);
      if (!campaign || campaign.status !== 'ACTIVE') {
        throw new BadRequestError('Payments can only be accepted for approved, ACTIVE campaigns');
      }

      const student = db.students.find((s) => s.id === input.student_id);
      if (!student) throw new NotFoundError('Student record not found');

      const payment = {
        id: crypto.randomUUID(),
        ...input,
        status: 'PENDING',
        recorded_by: actorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.payments.push(payment);

      await recordAudit({
        actor_id: actorId,
        action: 'RECORD_PAYMENT',
        entity_type: 'PAYMENT',
        entity_id: payment.id,
        new_state: payment,
      });

      return payment;
    }

    throw new Error('Real db implementation');
  }

  public async verifyPayment(paymentId: string, input: VerifyPaymentInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const payment = db.payments.find((p) => p.id === paymentId);
      if (!payment) throw new NotFoundError('Payment transaction not found');

      if (payment.status !== 'PENDING') {
        throw new BadRequestError(`Cannot verify payment with status '${payment.status}'`);
      }

      // FOUR-EYES PRINCIPLE: Officer who recorded payment CANNOT verify it
      if (payment.recorded_by === actorId) {
        throw new ForbiddenError(
          'Separation of Duties Violation: The officer who recorded the payment cannot verify it. Another authorized officer must conduct verification.'
        );
      }

      const campaign = db.campaigns.find((c) => c.id === payment.campaign_id);
      const student = db.students.find((s) => s.id === payment.student_id);
      const fund = db.funds.find((f) => f.id === campaign?.fund_id);

      if (!campaign || !student || !fund) {
        throw new NotFoundError('Associated campaign, student, or fund pool not found');
      }

      // 1. Generate Sequential Receipt Number
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(db.receipts.length + 1).padStart(4, '0')}`;

      // 2. Compute Cryptographic Signature Hash
      const signaturePayload = `${receiptNumber}:${student.student_id_number}:${payment.amount}:${campaign.title}`;
      const signatureHash = generateReceiptHmac(signaturePayload, config.receiptHmacSecret);

      // 3. Update Payment
      payment.status = 'VERIFIED';
      payment.verified_by = actorId;
      payment.verification_date = new Date().toISOString();
      payment.verification_note = input.verification_note || null;
      payment.receipt_number = receiptNumber;
      payment.updated_at = new Date().toISOString();

      // 4. Update Student Contribution Obligation
      let obligation = db.obligations.find(
        (o) => o.student_id === student.id && o.campaign_id === campaign.id
      );
      if (!obligation) {
        obligation = {
          id: crypto.randomUUID(),
          student_id: student.id,
          campaign_id: campaign.id,
          expected_amount: campaign.contribution_amount,
          verified_paid_amount: 0.0,
          waived_amount: 0.0,
          sponsored_amount: 0.0,
          status: 'DUE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.obligations.push(obligation);
      }

      obligation.verified_paid_amount = parseFloat(obligation.verified_paid_amount) + payment.amount;
      const expected = parseFloat(obligation.expected_amount);
      const paid = parseFloat(obligation.verified_paid_amount);
      const waived = parseFloat(obligation.waived_amount || '0');
      const sponsored = parseFloat(obligation.sponsored_amount || '0');

      if (paid + waived + sponsored >= expected) {
        obligation.status = 'PAID';
      } else {
        obligation.status = 'PARTIALLY_PAID';
      }
      obligation.updated_at = new Date().toISOString();

      // 5. Update Fund Balance
      fund.current_balance = parseFloat(fund.current_balance) + payment.amount;

      // 6. Create Immutable CREDIT Ledger Entry
      const ledgerEntry = {
        id: crypto.randomUUID(),
        fund_id: fund.id,
        entry_type: 'CREDIT',
        amount: payment.amount,
        balance_after: fund.current_balance,
        reference_type: 'PAYMENT',
        reference_id: payment.id,
        description: `Verified collection for ${campaign.title} from ${student.full_name} (${student.student_id_number}) [Ref: ${payment.transaction_reference}]`,
        created_by: actorId,
        created_at: new Date().toISOString(),
      };
      db.ledgerEntries.push(ledgerEntry);

      // 7. Store Receipt
      const receipt = {
        id: crypto.randomUUID(),
        payment_id: payment.id,
        receipt_number: receiptNumber,
        student_name: student.full_name,
        student_id_number: student.student_id_number,
        amount: payment.amount,
        campaign_title: campaign.title,
        issued_at: new Date().toISOString(),
        issued_by: actorId,
        signature_hash: signatureHash,
      };
      db.receipts.push(receipt);

      await recordAudit({
        actor_id: actorId,
        action: 'VERIFY_PAYMENT',
        entity_type: 'PAYMENT',
        entity_id: payment.id,
        new_state: { receipt_number: receiptNumber, amount: payment.amount },
      });

      return { payment, receipt, ledgerEntry };
    }

    throw new Error('Real db implementation');
  }

  public async reversePayment(paymentId: string, input: ReversePaymentInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const payment = db.payments.find((p) => p.id === paymentId);
      if (!payment) throw new NotFoundError('Payment transaction not found');

      if (payment.status !== 'VERIFIED') {
        throw new BadRequestError('Only VERIFIED payments can be reversed');
      }

      const campaign = db.campaigns.find((c) => c.id === payment.campaign_id);
      const student = db.students.find((s) => s.id === payment.student_id);
      const fund = db.funds.find((f) => f.id === campaign?.fund_id);

      if (!fund || !campaign || !student) throw new NotFoundError('Related financial entities not found');

      // Update payment
      payment.status = 'REVERSED';
      payment.reversal_reason = input.reversal_reason;
      payment.updated_at = new Date().toISOString();

      // Deduct from fund balance
      fund.current_balance = parseFloat(fund.current_balance) - payment.amount;

      // Compensating DEBIT ledger entry
      const ledgerEntry = {
        id: crypto.randomUUID(),
        fund_id: fund.id,
        entry_type: 'DEBIT',
        amount: payment.amount,
        balance_after: fund.current_balance,
        reference_type: 'REVERSAL',
        reference_id: payment.id,
        description: `Payment Reversal: ${input.reversal_reason} [Original Ref: ${payment.transaction_reference}]`,
        created_by: actorId,
        created_at: new Date().toISOString(),
      };
      db.ledgerEntries.push(ledgerEntry);

      // Adjust obligation
      const obligation = db.obligations.find((o) => o.student_id === student.id && o.campaign_id === campaign.id);
      if (obligation) {
        obligation.verified_paid_amount = Math.max(0, parseFloat(obligation.verified_paid_amount) - payment.amount);
        obligation.status = parseFloat(obligation.verified_paid_amount) > 0 ? 'PARTIALLY_PAID' : 'DUE';
        obligation.updated_at = new Date().toISOString();
      }

      await recordAudit({
        actor_id: actorId,
        action: 'REVERSE_PAYMENT',
        entity_type: 'PAYMENT',
        entity_id: payment.id,
        new_state: { reversal_reason: input.reversal_reason },
      });

      return { payment, ledgerEntry };
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // EXPENDITURES & PROCUREMENT AUDIT
  // ==========================================================================
  public async getExpenses(fundId?: string) {
    if (db instanceof InMemoryDatabase) {
      const list = fundId ? db.expenses.filter((e) => e.fund_id === fundId) : [...db.expenses];
      return list.map((e) => {
        const camp = db.campaigns.find((c) => c.id === e.campaign_id);
        const fund = db.funds.find((f) => f.id === e.fund_id);
        const requester = db.profiles.find((p) => p.id === e.requesting_officer_id);
        const pres = db.profiles.find((p) => p.id === e.approved_by_president_id);
        const evidence = db.evidenceFiles.filter((ef) => ef.entity_type === 'EXPENSE' && ef.entity_id === e.id);

        return {
          ...e,
          campaign_title: camp?.title,
          fund_name: fund?.name,
          requesting_officer_name: requester?.full_name,
          approver_name: pres?.full_name,
          evidence_files: evidence,
        };
      });
    }

    const res = await db.query(`
      SELECT e.*, c.title AS campaign_title, f.name AS fund_name, p.full_name AS requesting_officer_name
      FROM expenses e
      JOIN contribution_campaigns c ON c.id = e.campaign_id
      JOIN funds f ON f.id = e.fund_id
      JOIN profiles p ON p.id = e.requesting_officer_id
      ORDER BY e.created_at DESC
    `);
    return res.rows;
  }

  public async createExpenseRequest(input: CreateExpenseRequestInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const fund = db.funds.find((f) => f.id === input.fund_id);
      if (!fund) throw new NotFoundError('Fund pool not found');

      const expense = {
        id: crypto.randomUUID(),
        ...input,
        status: 'REQUESTED',
        requesting_officer_id: actorId,
        is_public_summary_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.expenses.push(expense);

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_EXPENSE_REQUEST',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        new_state: expense,
      });

      return expense;
    }

    throw new Error('Real db implementation');
  }

  public async approveExpense(expenseId: string, input: ApproveExpenseInput, actorId: string, userRoles: RoleName[]) {
    if (db instanceof InMemoryDatabase) {
      const expense = db.expenses.find((e) => e.id === expenseId);
      if (!expense) throw new NotFoundError('Expense request not found');

      // Approver cannot approve their own expense request
      if (expense.requesting_officer_id === actorId) {
        throw new ForbiddenError('Separation of Duties: You cannot approve an expense request you created yourself.');
      }

      const amountToApprove = input.approved_amount || expense.requested_amount;

      // Solvency check against fund balance
      const fund = db.funds.find((f) => f.id === expense.fund_id);
      if (!fund || fund.current_balance < amountToApprove) {
        throw new BadRequestError(
          `Solvency Invariant Violation: Fund '${fund?.name}' has balance $${fund?.current_balance}, which is insufficient for approved amount $${amountToApprove}.`
        );
      }

      // Dual Sign-Off Check for amounts > threshold
      const threshold = config.expenseDualApprovalThreshold;
      if (amountToApprove > threshold && !userRoles.includes(RoleName.GENERAL_PRESIDENT)) {
        throw new ForbiddenError(
          `Dual Approval Policy: Expenditures exceeding $${threshold} require executive Presidential sign-off.`
        );
      }

      expense.status = 'APPROVED';
      expense.approved_amount = amountToApprove;
      expense.approved_by_president_id = actorId;
      expense.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'APPROVE_EXPENSE',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        new_state: { approved_amount: amountToApprove, approved_by: actorId },
      });

      return expense;
    }

    throw new Error('Real db implementation');
  }

  public async disburseExpense(expenseId: string, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const expense = db.expenses.find((e) => e.id === expenseId);
      if (!expense || expense.status !== 'APPROVED') {
        throw new BadRequestError('Expense must be APPROVED prior to disbursement');
      }

      const fund = db.funds.find((f) => f.id === expense.fund_id);
      if (!fund || fund.current_balance < expense.approved_amount) {
        throw new BadRequestError('Insufficient fund balance for disbursement');
      }

      // 1. Deduct fund balance
      fund.current_balance = parseFloat(fund.current_balance) - expense.approved_amount;

      // 2. Insert immutable DEBIT ledger entry
      const ledgerEntry = {
        id: crypto.randomUUID(),
        fund_id: fund.id,
        entry_type: 'DEBIT',
        amount: expense.approved_amount,
        balance_after: fund.current_balance,
        reference_type: 'EXPENSE',
        reference_id: expense.id,
        description: `Disbursement to vendor ${expense.vendor_name} for ${expense.title}`,
        created_by: actorId,
        created_at: new Date().toISOString(),
      };
      db.ledgerEntries.push(ledgerEntry);

      expense.status = 'DISBURSED';
      expense.disbursed_at = new Date().toISOString();
      expense.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'DISBURSE_EXPENSE',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        new_state: { amount: expense.approved_amount, disbursed_at: expense.disbursed_at },
      });

      return { expense, ledgerEntry };
    }

    throw new Error('Real db implementation');
  }

  public async reconcileExpense(expenseId: string, input: ReconcileExpenseInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const expense = db.expenses.find((e) => e.id === expenseId);
      if (!expense || expense.status !== 'DISBURSED') {
        throw new BadRequestError('Expense must be in DISBURSED status for reconciliation');
      }

      // Attach evidence files
      for (const ef of input.evidence_files) {
        db.evidenceFiles.push({
          id: crypto.randomUUID(),
          entity_type: 'EXPENSE',
          entity_id: expense.id,
          file_name: ef.file_name,
          file_path: ef.file_path,
          file_size_bytes: ef.file_size_bytes,
          mime_type: ef.mime_type,
          is_public_evidence: ef.is_public,
          uploaded_by: actorId,
          created_at: new Date().toISOString(),
        });
      }

      expense.status = 'RECONCILED';
      expense.is_public_summary_published = true; // Automatically available in student transparency view
      expense.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'RECONCILE_EXPENSE',
        entity_type: 'EXPENSE',
        entity_id: expense.id,
        new_state: { evidence_count: input.evidence_files.length, reconciled: true },
      });

      return expense;
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // FUNDS
  // ==========================================================================
  public async getFunds() {
    if (db instanceof InMemoryDatabase) {
      return db.funds.map((f) => {
        const ledger = db.ledgerEntries.filter((l) => l.fund_id === f.id);
        const totalCredits = ledger.filter((l) => l.entry_type === 'CREDIT').reduce((acc, l) => acc + parseFloat(l.amount || '0'), 0);
        const totalDebits = ledger.filter((l) => l.entry_type === 'DEBIT').reduce((acc, l) => acc + parseFloat(l.amount || '0'), 0);
        return {
          ...f,
          total_credits: totalCredits,
          total_debits: totalDebits,
          ledger_entry_count: ledger.length,
        };
      });
    }

    const res = await db.query(`
      SELECT f.*,
        COALESCE(SUM(l.amount) FILTER (WHERE l.entry_type = 'CREDIT'), 0) AS total_credits,
        COALESCE(SUM(l.amount) FILTER (WHERE l.entry_type = 'DEBIT'), 0) AS total_debits,
        COUNT(l.id) AS ledger_entry_count
      FROM funds f
      LEFT JOIN ledger_entries l ON l.fund_id = f.id
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);
    return res.rows;
  }

  // ==========================================================================
  // PAYMENT LISTING
  // ==========================================================================
  public async getPayments(filters: { campaignId?: string; studentId?: string; status?: string }) {
    if (db instanceof InMemoryDatabase) {
      let list = [...db.payments];
      if (filters.campaignId) list = list.filter((p) => p.campaign_id === filters.campaignId);
      if (filters.studentId) list = list.filter((p) => p.student_id === filters.studentId);
      if (filters.status) list = list.filter((p) => p.status === filters.status);

      return list.map((p) => {
        const student = db.students.find((s) => s.id === p.student_id);
        const campaign = db.campaigns.find((c) => c.id === p.campaign_id);
        const recorder = db.profiles.find((pr) => pr.id === p.recorded_by);
        return {
          ...p,
          student_name: student?.full_name,
          student_id_number: student?.student_id_number,
          campaign_title: campaign?.title,
          recorded_by_name: recorder?.full_name,
        };
      });
    }

    const res = await db.query(`
      SELECT p.*, s.full_name AS student_name, s.student_id_number,
             c.title AS campaign_title, pr.full_name AS recorded_by_name
      FROM payments p
      JOIN students s ON s.id = p.student_id
      JOIN contribution_campaigns c ON c.id = p.campaign_id
      JOIN profiles pr ON pr.id = p.recorded_by
      ORDER BY p.created_at DESC
    `);
    return res.rows;
  }

  // ==========================================================================
  // LEDGER AUDIT & RECONCILIATION
  // ==========================================================================
  public async getLedgerEntries(fundId?: string, page = 1, pageSize = 30) {
    if (db instanceof InMemoryDatabase) {
      let list = fundId ? db.ledgerEntries.filter((l) => l.fund_id === fundId) : [...db.ledgerEntries];
      const total = list.length;
      const start = (page - 1) * pageSize;
      const items = list.slice(start, start + pageSize).map((l) => {
        const f = db.funds.find((fund) => fund.id === l.fund_id);
        const creator = db.profiles.find((p) => p.id === l.created_by);
        return {
          ...l,
          fund_name: f?.name,
          creator_name: creator?.full_name,
        };
      });

      return { items, total, page, pageSize };
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // STUDENT WELFARE & HARDSHIP CASES (CONFIDENTIAL)
  // ==========================================================================
  public async getWelfareCases(actorId: string, userRoles: RoleName[]) {
    // Strict Privacy Guard: Only General President, Vice President or Finance / Welfare officer
    const hasPrivilege =
      userRoles.includes(RoleName.GENERAL_PRESIDENT) ||
      userRoles.includes(RoleName.VICE_PRESIDENT) ||
      userRoles.includes(RoleName.FINANCE_OFFICER) ||
      userRoles.includes(RoleName.SYSTEM_ADMIN);

    if (!hasPrivilege) {
      throw new ForbiddenError('Access Denied: Confidential welfare records are restricted by security policy.');
    }

    if (db instanceof InMemoryDatabase) {
      return db.supportCases.map((sc) => {
        const student = db.students.find((s) => s.id === sc.student_id);
        const reviewer = db.profiles.find((p) => p.id === sc.welfare_reviewer_id);
        return {
          ...sc,
          student_name: student?.full_name,
          student_id_number: student?.student_id_number,
          reviewer_name: reviewer?.full_name,
        };
      });
    }

    throw new Error('Real db implementation');
  }

  public async createWelfareCase(input: CreateWelfareCaseInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const student = db.students.find((s) => s.id === input.student_id);
      if (!student) throw new NotFoundError('Student not found');

      const caseNumber = `WLF-${new Date().getFullYear()}-${String(db.supportCases.length + 1).padStart(4, '0')}`;
      const supportCase = {
        id: crypto.randomUUID(),
        case_number: caseNumber,
        ...input,
        approved_amount: 0.0,
        welfare_reviewer_id: actorId,
        status: 'SUBMITTED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.supportCases.push(supportCase);

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_WELFARE_CASE',
        entity_type: 'SUPPORT_CASE',
        entity_id: supportCase.id,
        new_state: { case_number: caseNumber, requested_amount: input.requested_amount },
      });

      return supportCase;
    }

    throw new Error('Real db implementation');
  }
}

export const financeService = new FinanceService();
