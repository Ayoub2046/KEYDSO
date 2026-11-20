import { Router } from 'express';
import { governanceController } from './governance.controller';
import { authGuard } from '../../security/auth.guard';
import { requireRoles } from '../../security/rbac.guard';
import { RoleName } from '@keydso/shared-types';

export const governanceRouter = Router();

// All governance endpoints require authenticated session
governanceRouter.use(authGuard);

// ---------------------------------------------------------------------------
// COUNCIL DASHBOARD
// ---------------------------------------------------------------------------
governanceRouter.get(
  '/dashboard',
  requireRoles([
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FACULTY_PRESIDENT,
    RoleName.SECRETARY,
    RoleName.FINANCE_OFFICER,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => governanceController.getDashboard(req, res, next)
);

// ---------------------------------------------------------------------------
// COMMITTEES
// ---------------------------------------------------------------------------
governanceRouter.get('/committees', (req, res, next) => governanceController.getCommittees(req, res, next));
governanceRouter.get('/committees/:id', (req, res, next) => governanceController.getCommitteeById(req, res, next));

governanceRouter.post(
  '/committees',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => governanceController.createCommittee(req, res, next)
);

governanceRouter.post(
  '/committees/:id/members',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.COMMITTEE_CHAIR, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => governanceController.assignMember(req, res, next)
);

governanceRouter.delete(
  '/committees/:id/members/:userId',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.COMMITTEE_CHAIR, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => governanceController.removeMember(req, res, next)
);

// ---------------------------------------------------------------------------
// COMMITTEE TASKS
// ---------------------------------------------------------------------------
governanceRouter.get('/tasks', (req, res, next) => governanceController.getTasks(req, res, next));

governanceRouter.post(
  '/tasks',
  requireRoles([
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.COMMITTEE_CHAIR,
    RoleName.FACULTY_PRESIDENT,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => governanceController.createTask(req, res, next)
);

governanceRouter.patch('/tasks/:id/status', (req, res, next) =>
  governanceController.updateTaskStatus(req, res, next)
);

// ---------------------------------------------------------------------------
// MEETINGS & TRAINING
// ---------------------------------------------------------------------------
governanceRouter.get('/meetings', (req, res, next) => governanceController.getMeetings(req, res, next));

governanceRouter.post(
  '/meetings',
  requireRoles([
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.FACULTY_PRESIDENT,
    RoleName.COMMITTEE_CHAIR,
    RoleName.SECRETARY,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => governanceController.createMeeting(req, res, next)
);

governanceRouter.post(
  '/meetings/:id/review',
  requireRoles([RoleName.GENERAL_PRESIDENT, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => governanceController.reviewMeeting(req, res, next)
);

governanceRouter.post(
  '/meetings/:id/minutes',
  requireRoles([RoleName.SECRETARY, RoleName.GENERAL_PRESIDENT, RoleName.SYSTEM_ADMIN]),
  (req, res, next) => governanceController.recordMinutes(req, res, next)
);

// ---------------------------------------------------------------------------
// FACULTY CHALLENGES & ISSUES
// ---------------------------------------------------------------------------
governanceRouter.get('/issues', (req, res, next) => governanceController.getIssues(req, res, next));
governanceRouter.post('/issues', (req, res, next) => governanceController.createIssue(req, res, next));

governanceRouter.patch(
  '/issues/:id/status',
  requireRoles([
    RoleName.FACULTY_PRESIDENT,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => governanceController.updateIssueStatus(req, res, next)
);

governanceRouter.post(
  '/issues/:id/resolve',
  requireRoles([
    RoleName.FACULTY_PRESIDENT,
    RoleName.GENERAL_PRESIDENT,
    RoleName.VICE_PRESIDENT,
    RoleName.SYSTEM_ADMIN,
  ]),
  (req, res, next) => governanceController.resolveIssue(req, res, next)
);
