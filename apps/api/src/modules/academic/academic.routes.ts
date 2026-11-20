import { Router } from 'express';
import { academicController } from './academic.controller';
import { authGuard } from '../../security/auth.guard';
import { requireRoles } from '../../security/rbac.guard';
import { RoleName } from '@keydso/shared-types';

export const academicRouter = Router();

// Read routes available to authenticated users
academicRouter.get('/academic-years', authGuard, (req, res, next) =>
  academicController.getAcademicYears(req, res, next)
);
academicRouter.get('/semesters', authGuard, (req, res, next) =>
  academicController.getSemesters(req, res, next)
);
academicRouter.get('/faculties', authGuard, (req, res, next) =>
  academicController.getFaculties(req, res, next)
);
academicRouter.get('/departments', authGuard, (req, res, next) =>
  academicController.getDepartments(req, res, next)
);
academicRouter.get('/classes', authGuard, (req, res, next) =>
  academicController.getClasses(req, res, next)
);

// Admin-only creation routes
academicRouter.post('/academic-years', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  academicController.createAcademicYear(req, res, next)
);
academicRouter.post('/semesters', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  academicController.createSemester(req, res, next)
);
academicRouter.post('/faculties', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  academicController.createFaculty(req, res, next)
);
academicRouter.post('/departments', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  academicController.createDepartment(req, res, next)
);
academicRouter.post('/classes', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  academicController.createClass(req, res, next)
);
