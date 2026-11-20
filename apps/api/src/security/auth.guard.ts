import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../common/config';
import { UnauthorizedError } from '../common/errors';
import { db, InMemoryDatabase } from '../database/db';
import { RoleName, UserProfile } from '@keydso/shared-types';

export interface AuthenticatedUser extends UserProfile {
  roles: RoleName[];
  assigned_faculty_id?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string; email: string };

    let user: any = null;
    let roles: RoleName[] = [];
    let assignedFacultyId: string | null = null;

    if (db instanceof InMemoryDatabase) {
      user = db.profiles.find((p) => p.id === decoded.sub && p.is_active);
      if (!user) {
        return next(new UnauthorizedError('User account not found or suspended'));
      }
      const userRoles = db.userRoleAssignments.filter((ura) => ura.user_id === user.id);
      roles = userRoles.map((ur) => {
        const r = db.roles.find((role) => role.id === ur.role_id);
        return r ? r.name : (RoleName.STUDENT as RoleName);
      });
      const facAssign = db.facultyAssignments.find((fa) => fa.user_id === user.id && fa.is_active);
      if (facAssign) assignedFacultyId = facAssign.faculty_id;
    } else {
      const userRes = await db.query('SELECT * FROM profiles WHERE id = $1 AND is_active = true', [decoded.sub]);
      if (userRes.rowCount === 0) {
        return next(new UnauthorizedError('User account not found or suspended'));
      }
      user = userRes.rows[0];

      const rolesRes = await db.query(
        `SELECT r.name FROM roles r
         JOIN user_role_assignments ura ON ura.role_id = r.id
         WHERE ura.user_id = $1`,
        [user.id]
      );
      roles = rolesRes.rows.map((row) => row.name as RoleName);

      const facRes = await db.query(
        'SELECT faculty_id FROM faculty_assignments WHERE user_id = $1 AND is_active = true LIMIT 1',
        [user.id]
      );
      if (facRes.rowCount && facRes.rowCount > 0) {
        assignedFacultyId = facRes.rows[0].faculty_id;
      }
    }

    req.user = {
      ...user,
      roles,
      assigned_faculty_id: assignedFacultyId,
    };
    next();
  } catch (err) {
    return next(new UnauthorizedError('Invalid or expired authentication token'));
  }
}
