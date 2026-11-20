import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@keydso/shared-types';
import { ForbiddenError, UnauthorizedError } from '../common/errors';

/**
 * Enforces cross-faculty boundary: Faculty Presidents can only act on their assigned faculty
 */
export function enforceFacultyScope(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  const { roles, assigned_faculty_id } = req.user;

  // Global executives and admins bypass single-faculty scope
  if (roles.includes(RoleName.SYSTEM_ADMIN) || roles.includes(RoleName.GENERAL_PRESIDENT)) {
    return next();
  }

  // If user is Faculty President, strictly match faculty_id from body, query or params
  if (roles.includes(RoleName.FACULTY_PRESIDENT)) {
    const targetFacultyId = req.params.facultyId || req.body.faculty_id || req.query.faculty_id;

    if (!targetFacultyId) {
      return next(); // If endpoint is not faculty-specific, proceed
    }

    if (targetFacultyId !== assigned_faculty_id) {
      return next(
        new ForbiddenError(
          `Security Policy Violation: You are assigned to faculty '${assigned_faculty_id}', but attempted an operation on faculty '${targetFacultyId}'. Cross-faculty operations are blocked.`
        )
      );
    }
  }

  next();
}
