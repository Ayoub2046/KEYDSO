import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { authGuard } from '../../security/auth.guard';

const router = Router();
const controller = new NotificationsController();

// All notification endpoints require authentication
router.use(authGuard);

router.get('/', controller.getMyNotifications);
router.patch('/:id/read', controller.markAsRead);
router.post('/mark-all-read', controller.markAllAsRead);
router.post('/push-subscription', controller.registerPushSubscription);
router.delete('/push-subscription', controller.unregisterPushSubscription);

export const notificationsRouter = router;
