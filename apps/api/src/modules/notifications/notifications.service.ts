import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import {
  InAppNotification,
  NotificationCenterOverview,
  NotificationType,
} from '@keydso/shared-types';
import { PushSubscriptionInput, CreateNotificationInput } from '@keydso/validation';

export class NotificationsService {
  private getDb(): InMemoryDatabase {
    return db as unknown as InMemoryDatabase;
  }

  /**
   * Retrieves notifications and unread counter for a specific user
   */
  public async getUserNotifications(userId: string): Promise<NotificationCenterOverview> {
    const dbInstance = this.getDb();
    const userNotes = dbInstance.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const unread_count = userNotes.filter((n) => !n.is_read).length;

    return {
      unread_count,
      total_count: userNotes.length,
      notifications: userNotes,
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(notificationId: string, userId: string): Promise<InAppNotification> {
    const dbInstance = this.getDb();
    const note = dbInstance.notifications.find((n) => n.id === notificationId);

    if (!note) {
      throw new NotFoundError('Notification not found');
    }

    if (note.user_id !== userId) {
      throw new ForbiddenError('Unauthorized: You cannot access or modify notifications of another user');
    }

    note.is_read = true;
    note.read_at = new Date().toISOString();

    return note;
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string): Promise<{ marked_count: number }> {
    const dbInstance = this.getDb();
    let count = 0;
    const now = new Date().toISOString();

    dbInstance.notifications.forEach((n) => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        n.read_at = now;
        count++;
      }
    });

    return { marked_count: count };
  }

  /**
   * Creates an in-app notification (called by system events or internal workflows)
   */
  public async createNotification(input: CreateNotificationInput): Promise<InAppNotification> {
    const dbInstance = this.getDb();
    const newNote: InAppNotification = {
      id: crypto.randomUUID(),
      user_id: input.user_id,
      title: input.title,
      message: input.message,
      type: input.type as NotificationType,
      action_url: input.action_url || null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    dbInstance.notifications.unshift(newNote);
    return newNote;
  }

  /**
   * Register or update a Web Push (VAPID) subscription
   */
  public async registerPushSubscription(
    userId: string,
    input: PushSubscriptionInput,
    userAgent?: string
  ): Promise<{ success: boolean; subscription_id: string }> {
    const dbInstance = this.getDb();
    // Check if endpoint already registered
    const existingIdx = dbInstance.pushSubscriptions.findIndex((s) => s.endpoint === input.endpoint);

    if (existingIdx >= 0) {
      dbInstance.pushSubscriptions[existingIdx] = {
        ...dbInstance.pushSubscriptions[existingIdx],
        user_id: userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        user_agent: userAgent || null,
        updated_at: new Date().toISOString(),
      };
      return { success: true, subscription_id: dbInstance.pushSubscriptions[existingIdx].id };
    }

    const newSub = {
      id: crypto.randomUUID(),
      user_id: userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      user_agent: userAgent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbInstance.pushSubscriptions.push(newSub);
    return { success: true, subscription_id: newSub.id };
  }

  /**
   * Remove a Web Push subscription
   */
  public async unregisterPushSubscription(userId: string, endpoint: string): Promise<{ success: boolean }> {
    const dbInstance = this.getDb();
    dbInstance.pushSubscriptions = dbInstance.pushSubscriptions.filter(
      (s) => !(s.user_id === userId && s.endpoint === endpoint)
    );
    return { success: true };
  }
}
