import jwt from 'jsonwebtoken';
import { config } from '../../common/config';
import { verifyPassword } from '../../common/crypto';
import { UnauthorizedError } from '../../common/errors';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { RoleName, AuthSession } from '@keydso/shared-types';
import { LoginInput } from '@keydso/validation';

export class AuthService {
  public async login(input: LoginInput, ip?: string, userAgent?: string): Promise<AuthSession> {
    let user: any = null;
    let roles: RoleName[] = [];
    let assignedFacultyId: string | null = null;

    if (db instanceof InMemoryDatabase) {
      user = db.profiles.find((p) => p.email.toLowerCase() === input.email.toLowerCase());
      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const isValid = await verifyPassword(input.password, user.password_hash);
      if (!isValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const userRoles = db.userRoleAssignments.filter((ura) => ura.user_id === user.id);
      roles = userRoles.map((ur) => {
        const r = db.roles.find((role) => role.id === ur.role_id);
        return r ? (r.name as RoleName) : RoleName.STUDENT;
      });

      const facAssign = db.facultyAssignments.find((fa) => fa.user_id === user.id && fa.is_active);
      if (facAssign) assignedFacultyId = facAssign.faculty_id;
    } else {
      const userRes = await db.query('SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)', [input.email]);
      if (userRes.rowCount === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }
      user = userRes.rows[0];
      if (!user.is_active) {
        throw new UnauthorizedError('User account suspended');
      }

      const isValid = await verifyPassword(input.password, user.password_hash);
      if (!isValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

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

    // Generate JWT Access & Refresh Tokens
    const payload = { sub: user.id, email: user.email, roles };
    const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ sub: user.id }, config.refreshTokenSecret, { expiresIn: '7d' });

    await recordAudit({
      actor_id: user.id,
      action: 'USER_LOGIN',
      entity_type: 'AUTH',
      entity_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    const { password_hash, ...safeProfile } = user;

    return {
      user: safeProfile,
      roles,
      assigned_faculty_id: assignedFacultyId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
  }
}

export const authService = new AuthService();
