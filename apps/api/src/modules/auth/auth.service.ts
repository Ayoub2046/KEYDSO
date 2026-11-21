import jwt from 'jsonwebtoken';
import { config } from '../../common/config';
import { verifyPassword, hashPasswordSync } from '../../common/crypto';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../../common/errors';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { RoleName, AuthSession } from '@keydso/shared-types';
import { LoginInput } from '@keydso/validation';

export class AuthService {
  public async login(input: LoginInput, ip?: string, userAgent?: string): Promise<AuthSession> {
    let user: any = null;
    let roles: RoleName[] = [];
    let assignedFacultyId: string | null = null;
    const identifier = input.email.trim();

    if (db instanceof InMemoryDatabase) {
      // 1. Try finding by email
      user = db.profiles.find((p) => p.email.toLowerCase() === identifier.toLowerCase());

      // 2. If not found, try finding student by student_id_number
      if (!user) {
        const student = db.students.find(
          (s) => s.student_id_number && s.student_id_number.toLowerCase() === identifier.toLowerCase()
        );
        if (student) {
          user = db.profiles.find(
            (p) => p.student_id === student.id || (p.email && p.email.toLowerCase() === student.email?.toLowerCase())
          );
        }
      }

      if (!user || !user.is_active) {
        throw new UnauthorizedError('Invalid student ID, email or password');
      }

      let isValid = await verifyPassword(input.password, user.password_hash);
      // Fallback: check if password matches student_id_number directly for first-time login
      if (!isValid && user.student_id) {
        const stu = db.students.find((s) => s.id === user.student_id);
        if (stu && stu.student_id_number?.toLowerCase() === input.password.toLowerCase()) {
          isValid = true;
        }
      }

      if (!isValid) {
        throw new UnauthorizedError('Invalid student ID, email or password');
      }

      const userRoles = db.userRoleAssignments.filter((ura) => ura.user_id === user.id);
      roles = userRoles.map((ur) => {
        const r = db.roles.find((role) => role.id === ur.role_id);
        return r ? (r.name as RoleName) : RoleName.STUDENT;
      });

      const facAssign = db.facultyAssignments.find((fa) => fa.user_id === user.id && fa.is_active);
      if (facAssign) assignedFacultyId = facAssign.faculty_id;
    } else {
      // PostgreSQL / Supabase
      // 1. Try finding by email
      let userRes = await db.query('SELECT * FROM profiles WHERE LOWER(email) = LOWER($1)', [identifier]);

      // 2. If not found by email, check students table by student_id_number
      if (userRes.rowCount === 0) {
        const studentRes = await db.query(
          'SELECT * FROM students WHERE LOWER(student_id_number) = LOWER($1)',
          [identifier]
        );
        if (studentRes.rowCount > 0) {
          const student = studentRes.rows[0];
          userRes = await db.query(
            'SELECT * FROM profiles WHERE student_id = $1 OR LOWER(email) = LOWER($2)',
            [student.id, student.email]
          );
        }
      }

      if (userRes.rowCount === 0) {
        throw new UnauthorizedError('Invalid student ID, email or password');
      }

      user = userRes.rows[0];
      if (!user.is_active) {
        throw new UnauthorizedError('User account suspended');
      }

      let isValid = await verifyPassword(input.password, user.password_hash);
      // Fallback: check if password matches student_id_number directly for first-time login
      if (!isValid && user.student_id) {
        const stuCheck = await db.query(
          'SELECT student_id_number FROM students WHERE id = $1',
          [user.student_id]
        );
        if (stuCheck.rows[0]?.student_id_number?.toLowerCase() === input.password.toLowerCase()) {
          isValid = true;
        }
      }

      if (!isValid) {
        throw new UnauthorizedError('Invalid student ID, email or password');
      }

      const rolesRes = await db.query(
        `SELECT r.name FROM roles r
         JOIN user_role_assignments ura ON ura.role_id = r.id
         WHERE ura.user_id = $1`,
        [user.id]
      );
      roles = rolesRes.rows.map((row: any) => row.name as RoleName);
      if (roles.length === 0) {
        roles = [RoleName.STUDENT];
      }

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

  public async changePassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
    if (!newPass || newPass.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters long');
    }

    let user: any;
    if (db instanceof InMemoryDatabase) {
      user = db.profiles.find((p) => p.id === userId);
      if (!user) throw new NotFoundError('User profile not found');

      let isValid = await verifyPassword(currentPass, user.password_hash);
      if (!isValid && user.student_id) {
        const stu = db.students.find((s) => s.id === user.student_id);
        if (stu && stu.student_id_number?.toLowerCase() === currentPass.toLowerCase()) {
          isValid = true;
        }
      }

      if (!isValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      user.password_hash = hashPasswordSync(newPass);
    } else {
      const userRes = await db.query('SELECT * FROM profiles WHERE id = $1', [userId]);
      if (userRes.rowCount === 0) {
        throw new NotFoundError('User profile not found');
      }
      user = userRes.rows[0];

      let isValid = await verifyPassword(currentPass, user.password_hash);
      if (!isValid && user.student_id) {
        const stuRes = await db.query('SELECT student_id_number FROM students WHERE id = $1', [user.student_id]);
        if (stuRes.rows[0]?.student_id_number?.toLowerCase() === currentPass.toLowerCase()) {
          isValid = true;
        }
      }

      if (!isValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      const newHash = hashPasswordSync(newPass);
      await db.query('UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
    }

    await recordAudit({
      actor_id: userId,
      action: 'CHANGE_PASSWORD',
      entity_type: 'USER',
      entity_id: userId,
    });

    return true;
  }
}

export const authService = new AuthService();
