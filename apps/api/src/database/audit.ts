import crypto from 'crypto';
import { db, InMemoryDatabase } from './db';
import { logger } from '../common/logger';
import { AuditLogEntry } from '@keydso/shared-types';

export interface RecordAuditParams {
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  previous_state?: Record<string, unknown> | null;
  new_state?: Record<string, unknown> | null;
}

export async function recordAudit(params: RecordAuditParams): Promise<void> {
  const auditEntry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actor_id: params.actor_id || null,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    ip_address: params.ip_address || null,
    user_agent: params.user_agent || null,
    previous_state: params.previous_state || null,
    new_state: params.new_state || null,
  };

  try {
    if (db instanceof InMemoryDatabase) {
      db.auditLogs.unshift(auditEntry);
    } else {
      await db.query(
        `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, ip_address, user_agent, previous_state, new_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          auditEntry.actor_id,
          auditEntry.action,
          auditEntry.entity_type,
          auditEntry.entity_id,
          auditEntry.ip_address,
          auditEntry.user_agent,
          auditEntry.previous_state ? JSON.stringify(auditEntry.previous_state) : null,
          auditEntry.new_state ? JSON.stringify(auditEntry.new_state) : null,
        ]
      );
    }
    logger.info(`Audit: ${params.action} on ${params.entity_type}:${params.entity_id}`, {
      actorId: params.actor_id,
    });
  } catch (err) {
    logger.error('Failed to write audit log entry', err);
  }
}
