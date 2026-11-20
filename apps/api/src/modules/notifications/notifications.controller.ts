import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { PushSubscriptionSchema } from '@keydso/validation';
import { AuthenticatedUser } from '../../security/auth.guard';
import { UnauthorizedError } from '../../common/errors';

export class NotificationsController {
  private service: NotificationsService;

  constructor() {
    this.service = new NotificationsService();
  }

  public getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user) throw new UnauthorizedError();

      const data = await this.service.getUserNotifications(user.id);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user) throw new UnauthorizedError();

      const notificationId = req.params.id;
      const data = await this.service.markAsRead(notificationId, user.id);

      res.json({
        success: true,
        message: 'Notification marked as read',
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user) throw new UnauthorizedError();

      const data = await this.service.markAllAsRead(user.id);

      res.json({
        success: true,
        message: `Marked ${data.marked_count} notifications as read`,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public registerPushSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user) throw new UnauthorizedError();

      const input = PushSubscriptionSchema.parse(req.body);
      const userAgent = req.headers['user-agent'];
      const data = await this.service.registerPushSubscription(user.id, input, userAgent);

      res.status(201).json({
        success: true,
        message: 'Push subscription registered successfully',
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public unregisterPushSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user) throw new UnauthorizedError();

      const endpoint = req.body.endpoint;
      const data = await this.service.unregisterPushSubscription(user.id, endpoint);

      res.json({
        success: true,
        message: 'Push subscription removed',
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}
