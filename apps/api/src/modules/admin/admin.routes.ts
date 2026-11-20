import { Router } from 'express';
import { adminController } from './admin.controller';
import { authGuard } from '../../security/auth.guard';
import { requireRoles } from '../../security/rbac.guard';
import { RoleName } from '@keydso/shared-types';

export const adminRouter = Router();

// All admin endpoints strictly require SYSTEM_ADMIN
adminRouter.use(authGuard);
adminRouter.use(requireRoles([RoleName.SYSTEM_ADMIN]));

adminRouter.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
adminRouter.post('/users', (req, res, next) => adminController.createUser(req, res, next));
adminRouter.post('/assign-faculty-rep', (req, res, next) =>
  adminController.assignFacultyRepresentative(req, res, next)
);
adminRouter.get('/audit-logs', (req, res, next) => adminController.getAuditLogs(req, res, next));
