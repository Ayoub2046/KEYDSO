import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { LoginSchema, PasswordChangeSchema } from '@keydso/validation';
import { sendSuccess } from '../../common/response';
import { UnauthorizedError } from '../../common/errors';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginSchema.parse(req.body);
      const session = await authService.login(validated, req.ip, req.headers['user-agent']);
      sendSuccess(res, session, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      sendSuccess(res, req.user, 'Current user profile');
    } catch (err) {
      next(err);
    }
  }

  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }
      const validated = PasswordChangeSchema.parse(req.body);
      await authService.changePassword(req.user.id, validated.current_password, validated.new_password);
      sendSuccess(res, { updated: true }, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, { logged_out: true }, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
