import { Request, Response, NextFunction } from 'express';
import { financeService } from './finance.service';
import { sendSuccess } from '../../common/response';
import {
  CreateCampaignSchema,
  RecordPaymentSchema,
  VerifyPaymentSchema,
  ReversePaymentSchema,
  CreateExpenseRequestSchema,
  ApproveExpenseSchema,
  ReconcileExpenseSchema,
  CreateWelfareCaseSchema,
} from '@keydso/validation';
import { RoleName } from '@keydso/shared-types';

export class FinanceController {
  // ---------------------------------------------------------------------------
  // CAMPAIGNS
  // ---------------------------------------------------------------------------
  public async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const academicYearId = req.query.academic_year_id as string | undefined;
      const campaigns = await financeService.getCampaigns(academicYearId);
      sendSuccess(res, campaigns, 'Campaigns retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  public async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateCampaignSchema.parse(req.body);
      const campaign = await financeService.createCampaign(validated, req.user!.id);
      sendSuccess(res, campaign, 'Contribution campaign created', 201);
    } catch (err) {
      next(err);
    }
  }

  public async approveCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await financeService.approveCampaign(req.params.id, req.user!.id);
      sendSuccess(res, result, `Campaign approved. ${result.generated_obligations} student obligations generated`);
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------------------------
  public async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { campaign_id, student_id, status } = req.query as Record<string, string | undefined>;
      const payments = await financeService.getPayments({ campaignId: campaign_id, studentId: student_id, status });
      sendSuccess(res, payments, 'Payments retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RecordPaymentSchema.parse(req.body);
      const payment = await financeService.recordPayment(validated, req.user!.id);
      sendSuccess(res, payment, 'Payment recorded and queued for verification', 201);
    } catch (err) {
      next(err);
    }
  }

  public async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = VerifyPaymentSchema.parse(req.body);
      const result = await financeService.verifyPayment(req.params.id, validated, req.user!.id);
      sendSuccess(res, result, 'Payment verified. Receipt issued and ledger updated');
    } catch (err) {
      next(err);
    }
  }

  public async reversePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReversePaymentSchema.parse(req.body);
      const result = await financeService.reversePayment(req.params.id, validated, req.user!.id);
      sendSuccess(res, result, 'Payment reversed and compensating ledger entry recorded');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // EXPENSES & PROCUREMENT
  // ---------------------------------------------------------------------------
  public async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fundId = req.query.fund_id as string | undefined;
      const expenses = await financeService.getExpenses(fundId);
      sendSuccess(res, expenses, 'Expenses retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createExpenseRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateExpenseRequestSchema.parse(req.body);
      const expense = await financeService.createExpenseRequest(validated, req.user!.id);
      sendSuccess(res, expense, 'Expense request submitted for approval', 201);
    } catch (err) {
      next(err);
    }
  }

  public async approveExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ApproveExpenseSchema.parse(req.body);
      const expense = await financeService.approveExpense(
        req.params.id,
        validated,
        req.user!.id,
        req.user!.roles as RoleName[]
      );
      sendSuccess(res, expense, 'Expense request approved. Ready for disbursement');
    } catch (err) {
      next(err);
    }
  }

  public async disburseExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await financeService.disburseExpense(req.params.id, req.user!.id);
      sendSuccess(res, result, 'Expense disbursed. Fund balance updated and ledger debited');
    } catch (err) {
      next(err);
    }
  }

  public async reconcileExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReconcileExpenseSchema.parse(req.body);
      const expense = await financeService.reconcileExpense(req.params.id, validated, req.user!.id);
      sendSuccess(res, expense, 'Expense reconciled and published to public transparency feed');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // LEDGER
  // ---------------------------------------------------------------------------
  public async getLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fundId = req.query.fund_id as string | undefined;
      const page = parseInt((req.query.page as string) || '1', 10);
      const pageSize = parseInt((req.query.page_size as string) || '30', 10);
      const result = await financeService.getLedgerEntries(fundId, page, pageSize);
      sendSuccess(res, result, 'Ledger entries retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // FUNDS
  // ---------------------------------------------------------------------------
  public async getFunds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const funds = await financeService.getFunds();
      sendSuccess(res, funds, 'Fund pools retrieved');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // WELFARE & HARDSHIP CASES
  // ---------------------------------------------------------------------------
  public async getWelfareCases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cases = await financeService.getWelfareCases(req.user!.id, req.user!.roles as RoleName[]);
      sendSuccess(res, cases, 'Welfare cases retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createWelfareCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateWelfareCaseSchema.parse(req.body);
      const supportCase = await financeService.createWelfareCase(validated, req.user!.id);
      sendSuccess(res, supportCase, 'Welfare case submitted for review', 201);
    } catch (err) {
      next(err);
    }
  }
}

export const financeController = new FinanceController();
