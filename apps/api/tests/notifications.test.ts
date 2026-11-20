import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('In-App Notification Center & Push Engine — Phase 6', () => {
  let studentToken: string;
  let csitRepToken: string;
  let presidentToken: string;
  let sampleStudentNotificationId: string;
  let sampleRepNotificationId: string;

  beforeAll(async () => {
    const [stuRes, csitRes, presRes] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({
        email: 'student.demo@keydso.university.edu',
        password: 'StudentPass123!',
      }),
      request(app).post('/api/v1/auth/login').send({
        email: 'csit.rep@keydso.university.edu',
        password: 'AdminPass123!',
      }),
      request(app).post('/api/v1/auth/login').send({
        email: 'president@keydso.university.edu',
        password: 'AdminPass123!',
      }),
    ]);

    expect(stuRes.status).toBe(200);
    expect(csitRes.status).toBe(200);
    expect(presRes.status).toBe(200);

    studentToken = stuRes.body.data.access_token;
    csitRepToken = csitRes.body.data.access_token;
    presidentToken = presRes.body.data.access_token;
  });

  describe('GET /api/v1/notifications', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('should return notification center overview for student with unread count', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('unread_count');
      expect(data).toHaveProperty('total_count');
      expect(Array.isArray(data.notifications)).toBe(true);
      expect(data.notifications.length).toBeGreaterThanOrEqual(1);

      sampleStudentNotificationId = data.notifications[0].id;
    });

    it('should return notifications scoped specifically to logged-in user', async () => {
      const res = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${csitRepToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      sampleRepNotificationId = data.notifications[0].id;

      // Ensure student notification is not present in faculty rep feed
      const found = data.notifications.find((n: any) => n.id === sampleStudentNotificationId);
      expect(found).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark student notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${sampleStudentNotificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_read).toBe(true);
      expect(res.body.data.read_at).toBeTruthy();
    });

    it('should prevent user A from marking user B notification as read (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${sampleRepNotificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent notification ID', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/00000000-0000-0000-0000-000000000999/read')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/notifications/mark-all-read', () => {
    it('should mark all unread notifications for user as read', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/mark-all-read')
        .set('Authorization', `Bearer ${presidentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('marked_count');

      // Verify unread count is now 0
      const checkRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${presidentToken}`);

      expect(checkRes.body.data.unread_count).toBe(0);
    });
  });

  describe('POST & DELETE /api/v1/notifications/push-subscription', () => {
    const validSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample-token-12345',
      keys: {
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9Q0_Wl9pD',
        auth: 'tBHItJI5svbpez7KI4CCXg',
      },
    };

    it('should register a valid Web Push VAPID subscription', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/push-subscription')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validSubscription);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('subscription_id');
    });

    it('should reject invalid push subscription payload with 400', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/push-subscription')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          endpoint: 'not-a-url',
          keys: { p256dh: 'short' },
        });

      expect(res.status).toBe(400);
    });

    it('should remove push subscription on unregister', async () => {
      const res = await request(app)
        .delete('/api/v1/notifications/push-subscription')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ endpoint: validSubscription.endpoint });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
