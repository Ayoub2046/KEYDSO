import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authGuard } from '../../security/auth.guard';
import { requireRoles } from '../../security/rbac.guard';
import { RoleName } from '@keydso/shared-types';

const router = Router();
const controller = new ReportsController();

// All analytics endpoints require authentication
router.use(authGuard);

// Financial Overview
router.get(
  '/financial-overview',
  requireRoles([
    RoleName.SYSTEM_ADMIN,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FINANCE_OFFICER,
    RoleName.FACULTY_PRESIDENT,
    RoleName.SECRETARY,
  ]),
  controller.getFinancialOverview
);

// Faculty Performance Comparative Rankings
router.get(
  '/faculty-performance',
  requireRoles([
    RoleName.SYSTEM_ADMIN,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FINANCE_OFFICER,
    RoleName.FACULTY_PRESIDENT,
    RoleName.SECRETARY,
  ]),
  controller.getFacultyPerformance
);

// Committee and Governance Analytics
router.get(
  '/governance-analytics',
  requireRoles([
    RoleName.SYSTEM_ADMIN,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.SECRETARY,
    RoleName.FACULTY_PRESIDENT,
    RoleName.COMMITTEE_CHAIR,
    RoleName.COMMITTEE_MEMBER,
  ]),
  controller.getCommitteeGovernanceAnalytics
);

// Audit Report Export (Structured JSON + Cryptographic Seal)
router.get(
  '/audit-export',
  requireRoles([
    RoleName.SYSTEM_ADMIN,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FINANCE_OFFICER,
    RoleName.SECRETARY,
  ]),
  controller.generateAuditExport
);

// Financial CSV Download
router.get(
  '/export/financial-csv',
  requireRoles([
    RoleName.SYSTEM_ADMIN,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FINANCE_OFFICER,
  ]),
  controller.exportFinancialCsv
);

export const reportsRouter = router;
