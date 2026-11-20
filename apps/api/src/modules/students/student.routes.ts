import { Router } from 'express';
import { studentController } from './student.controller';
import { authGuard } from '../../security/auth.guard';
import { requireRoles } from '../../security/rbac.guard';
import { enforceFacultyScope } from '../../security/faculty.guard';
import { RoleName } from '@keydso/shared-types';

export const studentRouter = Router();

// Read directory
studentRouter.get('/', authGuard, enforceFacultyScope, (req, res, next) =>
  studentController.getStudents(req, res, next)
);

studentRouter.get('/:id', authGuard, (req, res, next) =>
  studentController.getStudentById(req, res, next)
);

// Admin-only mutations
studentRouter.post('/', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  studentController.registerStudent(req, res, next)
);

studentRouter.post('/import', authGuard, requireRoles([RoleName.SYSTEM_ADMIN]), (req, res, next) =>
  studentController.bulkImport(req, res, next)
);
