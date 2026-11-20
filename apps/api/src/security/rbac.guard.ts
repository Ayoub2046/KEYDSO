import { Request, Response, NextFunction } from 'express';
import { RoleName } from '@keydso/shared-types';
import { ForbiddenError, UnauthorizedError } from '../common/errors';

/**
 * Middleware factory requiring user to possess at least one of the specified roles
 */
export function requireRoles(allowedRoles: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userRoles = req.user.roles || [];
    const hasPermission = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasPermission) {
      return next(
        new ForbiddenError(
          `Access Denied: Requires one of [${allowedRoles.join(', ')}], but current user holds [${userRoles.join(', ')}]`
        )
      );
    }

    next();
  };
}
