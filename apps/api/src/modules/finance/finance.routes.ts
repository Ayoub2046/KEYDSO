import { Router } from 'express';
import { financeController } from './finance.controller';
import { authGuard } from '../../security/auth.guard';
import { requireRoles } from '../../security/rbac.guard';
import { RoleName } from '@keydso/shared-types';

export const financeRouter = Router();

// All finance endpoints require authentication
financeRouter.use(authGuard);

// ---------------------------------------------------------------------------
// CAMPAIGN ROUTES
// ---------------------------------------------------------------------------
// GET  /finance/campaigns         — any authenticated user (students see active campaigns in their scope)
financeRouter.get('/campaigns', (req, res, next) => financeController.getCampaigns(req, res, next));

// POST /finance/campaigns         — Finance Officer only
financeRouter.post(
  '/campaigns',
  requireRoles([RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.createCampaign(req, res, next)
);

// POST /finance/campaigns/:id/approve — General President or Admin
financeRouter.post(
  '/campaigns/:id/approve',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.approveCampaign(req, res, next)
);

// ---------------------------------------------------------------------------
// PAYMENT ROUTES
// ---------------------------------------------------------------------------
// GET  /finance/payments          — Finance Officer or Admin
financeRouter.get(
  '/payments',
  requireRoles([RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN, RoleName.GENERAL_PRESIDENT]),
  (req, res, next) => financeController.getPayments(req, res, next)
);

// POST /finance/payments          — Finance Officer records intake
financeRouter.post(
  '/payments',
  requireRoles([RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.recordPayment(req, res, next)
);

// POST /finance/payments/:id/verify — Finance Officer (four-eyes enforced in service)
financeRouter.post(
  '/payments/:id/verify',
  requireRoles([RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.verifyPayment(req, res, next)
);

// POST /finance/payments/:id/reverse — General President or Finance Officer with valid reason
financeRouter.post(
  '/payments/:id/reverse',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.reversePayment(req, res, next)
);

// ---------------------------------------------------------------------------
// EXPENSE / PROCUREMENT ROUTES
// ---------------------------------------------------------------------------
// GET  /finance/expenses          — authenticated staff
financeRouter.get(
  '/expenses',
  requireRoles([
    RoleName.FINANCE_OFFICER,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FACULTY_PRESIDENT,
    RoleName.SECRETARY,
    RoleName.COMMITTEE_CHAIR,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => financeController.getExpenses(req, res, next)
);

// POST /finance/expenses          — faculty/committee can submit requests
financeRouter.post(
  '/expenses',
  requireRoles([
    RoleName.FACULTY_PRESIDENT,
    RoleName.FINANCE_OFFICER,
    RoleName.SECRETARY,
    RoleName.COMMITTEE_CHAIR,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => financeController.createExpenseRequest(req, res, next)
);

// POST /finance/expenses/:id/approve — General President (dual sign-off enforced in service)
financeRouter.post(
  '/expenses/:id/approve',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.approveExpense(req, res, next)
);

// POST /finance/expenses/:id/disburse — Finance Officer
financeRouter.post(
  '/expenses/:id/disburse',
  requireRoles([RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.disburseExpense(req, res, next)
);

// POST /finance/expenses/:id/reconcile — Finance Officer uploads receipts/invoices
financeRouter.post(
  '/expenses/:id/reconcile',
  requireRoles([RoleName.FINANCE_OFFICER, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => financeController.reconcileExpense(req, res, next)
);

// ---------------------------------------------------------------------------
// LEDGER ROUTES
// ---------------------------------------------------------------------------
// GET  /finance/ledger            — Senior officials only
financeRouter.get(
  '/ledger',
  requireRoles([RoleName.SYSTEM_ADMIN, RoleName.GENERAL_PRESIDENT, RoleName.FINANCE_OFFICER]),
  (req, res, next) => financeController.getLedger(req, res, next)
);

// ---------------------------------------------------------------------------
// FUND ROUTES
// ---------------------------------------------------------------------------
financeRouter.get('/funds', (req, res, next) => financeController.getFunds(req, res, next));

// ---------------------------------------------------------------------------
// WELFARE / HARDSHIP CASE ROUTES
// ---------------------------------------------------------------------------
// GET  /finance/welfare           — Privileged roles only (privacy guard in service)
financeRouter.get(
  '/welfare',
  requireRoles([
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FINANCE_OFFICER,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => financeController.getWelfareCases(req, res, next)
);

// POST /finance/welfare           — Faculty President or Student can submit
financeRouter.post(
  '/welfare',
  requireRoles([RoleName.FACULTY_PRESIDENT, RoleName.STUDENT, RoleName.SYSTEM_ADMIN, RoleName.FINANCE_OFFICER]),
  (req, res, next) => financeController.createWelfareCase(req, res, next)
);
