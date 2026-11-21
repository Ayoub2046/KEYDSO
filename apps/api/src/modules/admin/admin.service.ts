import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { ConflictError, NotFoundError, BadRequestError } from '../../common/errors';
import { hashPassword } from '../../common/crypto';
import { RoleName, LandingPageSettings } from '@keydso/shared-types';
import { LandingSettingsInput } from '@keydso/validation';
import { portalService } from '../portal/portal.service';

export class AdminService {
  public async getUsers() {
    if (db instanceof InMemoryDatabase) {
      return db.profiles.map((p) => {
        const userRoles = db.userRoleAssignments
          .filter((ura) => ura.user_id === p.id)
          .map((ur) => {
            const r = db.roles.find((role) => role.id === ur.role_id);
            return r?.name;
          })
          .filter(Boolean);

        const facAssign = db.facultyAssignments.find((fa) => fa.user_id === p.id && fa.is_active);
        let facultyName: string | undefined;
        if (facAssign) {
          const fac = db.faculties.find((f) => f.id === facAssign.faculty_id);
          facultyName = fac?.name;
        }

        const { password_hash, ...safe } = p;
        return {
          ...safe,
          roles: userRoles,
          assigned_faculty_id: facAssign?.faculty_id,
          assigned_faculty_name: facultyName,
        };
      });
    }

    const res = await db.query(`
      SELECT p.id, p.email, p.full_name, p.contact_number, p.is_active, p.created_at,
             COALESCE(ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles,
             fa.faculty_id AS assigned_faculty_id,
             f.name AS assigned_faculty_name
      FROM profiles p
      LEFT JOIN user_role_assignments ura ON ura.user_id = p.id
      LEFT JOIN roles r ON r.id = ura.role_id
      LEFT JOIN faculty_assignments fa ON fa.user_id = p.id AND fa.is_active = true
      LEFT JOIN faculties f ON f.id = fa.faculty_id
      GROUP BY p.id, fa.faculty_id, f.name
      ORDER BY p.full_name ASC
    `);
    return res.rows;
  }

  public async createUser(data: { email: string; full_name: string; password: string; roles: RoleName[] }, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const exists = db.profiles.some((p) => p.email.toLowerCase() === data.email.toLowerCase());
      if (exists) throw new ConflictError('User with this email already exists');

      const passwordHash = await hashPassword(data.password);
      const newUser = {
        id: crypto.randomUUID(),
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: data.full_name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.profiles.push(newUser);

      // Assign roles
      for (const roleName of data.roles) {
        const roleObj = db.roles.find((r) => r.name === roleName);
        if (roleObj) {
          db.userRoleAssignments.push({
            id: crypto.randomUUID(),
            user_id: newUser.id,
            role_id: roleObj.id,
            assigned_by: actorId,
            assigned_at: new Date().toISOString(),
          });
        }
      }

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_USER',
        entity_type: 'USER',
        entity_id: newUser.id,
        new_state: { email: newUser.email, roles: data.roles },
      });

      const { password_hash, ...safe } = newUser;
      return { ...safe, roles: data.roles };
    }

    const passwordHash = await hashPassword(data.password);
    const userRes = await db.query(
      `INSERT INTO profiles (email, password_hash, full_name, is_active)
       VALUES (LOWER($1), $2, $3, true) RETURNING id, email, full_name, is_active, created_at`,
      [data.email, passwordHash, data.full_name]
    );
    const newUser = userRes.rows[0];

    for (const roleName of data.roles) {
      const rRes = await db.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      if (rRes.rowCount && rRes.rowCount > 0) {
        await db.query(
          `INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
           VALUES ($1, $2, $3)`,
          [newUser.id, rRes.rows[0].id, actorId]
        );
      }
    }

    await recordAudit({
      actor_id: actorId,
      action: 'CREATE_USER',
      entity_type: 'USER',
      entity_id: newUser.id,
      new_state: { email: newUser.email, roles: data.roles },
    });
    return { ...newUser, roles: data.roles };
  }

  public async assignFacultyRepresentative(
    data: { user_id: string; faculty_id: string; academic_year_id: string; role_title: string },
    actorId: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const user = db.profiles.find((p) => p.id === data.user_id);
      if (!user) throw new NotFoundError('User not found');
      const faculty = db.faculties.find((f) => f.id === data.faculty_id);
      if (!faculty) throw new NotFoundError('Faculty not found');

      // Deactivate any existing active rep for that faculty
      db.facultyAssignments.forEach((fa) => {
        if (fa.faculty_id === data.faculty_id && fa.is_active) {
          fa.is_active = false;
        }
      });

      const assignment = {
        id: crypto.randomUUID(),
        ...data,
        is_active: true,
        assigned_at: new Date().toISOString(),
      };
      db.facultyAssignments.push(assignment);

      // Ensure user has FACULTY_PRESIDENT role
      const facRole = db.roles.find((r) => r.name === RoleName.FACULTY_PRESIDENT);
      if (facRole && !db.userRoleAssignments.some((ura) => ura.user_id === user.id && ura.role_id === facRole.id)) {
        db.userRoleAssignments.push({
          id: crypto.randomUUID(),
          user_id: user.id,
          role_id: facRole.id,
          assigned_by: actorId,
          assigned_at: new Date().toISOString(),
        });
      }

      await recordAudit({
        actor_id: actorId,
        action: 'ASSIGN_FACULTY_REPRESENTATIVE',
        entity_type: 'FACULTY_ASSIGNMENT',
        entity_id: assignment.id,
        new_state: assignment,
      });

      return { ...assignment, faculty_name: faculty.name, representative_name: user.full_name };
    }

    // Postgres: atomic update
    await db.query(
      `UPDATE faculty_assignments SET is_active = false WHERE faculty_id = $1 AND is_active = true`,
      [data.faculty_id]
    );

    const assignRes = await db.query(
      `INSERT INTO faculty_assignments (user_id, faculty_id, academic_year_id, role_title, is_active)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [data.user_id, data.faculty_id, data.academic_year_id, data.role_title]
    );

    // Grant FACULTY_PRESIDENT role if missing
    const rRes = await db.query('SELECT id FROM roles WHERE name = $1', [RoleName.FACULTY_PRESIDENT]);
    if (rRes.rowCount && rRes.rowCount > 0) {
      await db.query(
        `INSERT INTO user_role_assignments (user_id, role_id, assigned_by)
         VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [data.user_id, rRes.rows[0].id, actorId]
      );
    }

    await recordAudit({
      actor_id: actorId,
      action: 'ASSIGN_FACULTY_REPRESENTATIVE',
      entity_type: 'FACULTY_ASSIGNMENT',
      entity_id: assignRes.rows[0].id,
      new_state: assignRes.rows[0],
    });

    return assignRes.rows[0];
  }

  public async getAuditLogs(page = 1, pageSize = 30) {
    if (db instanceof InMemoryDatabase) {
      const total = db.auditLogs.length;
      const start = (page - 1) * pageSize;
      const items = db.auditLogs.slice(start, start + pageSize);
      return { items, total, page, pageSize };
    }

    const countRes = await db.query('SELECT COUNT(*) FROM audit_logs');
    const total = parseInt(countRes.rows[0].count, 10);

    const res = await db.query(
      `SELECT a.*, p.full_name AS actor_name, p.email AS actor_email
       FROM audit_logs a
       LEFT JOIN profiles p ON p.id = a.actor_id
       ORDER BY a.timestamp DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, (page - 1) * pageSize]
    );
    return { items: res.rows, total, page, pageSize };
  }

  public async updateLandingSettings(data: LandingSettingsInput, actorId: string): Promise<LandingPageSettings> {
    const current = await portalService.getLandingSettings();
    const updated: LandingPageSettings = {
      ...current,
      ...data,
      updated_at: new Date().toISOString(),
    };

    if (db instanceof InMemoryDatabase) {
      if (!db.siteSettings) db.siteSettings = {};
      db.siteSettings.landing_page = updated;
    } else {
      await db.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          updated_by UUID
        )
      `);

      await db.query(`
        INSERT INTO site_settings (key, value, updated_at, updated_by)
        VALUES ('landing_page', $1, NOW(), $2)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by
      `, [JSON.stringify(updated), actorId]);
    }

    await recordAudit({
      actor_id: actorId,
      action: 'UPDATE_LANDING_SETTINGS',
      entity_type: 'SITE_SETTINGS',
      entity_id: 'landing_page',
      new_state: { ...updated },
    });

    return updated;
  }
}

export const adminService = new AdminService();
