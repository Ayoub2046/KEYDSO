import { Router } from 'express';
import { authController } from './auth.controller';
import { authGuard } from '../../security/auth.guard';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => authController.login(req, res, next));
authRouter.get('/me', authGuard, (req, res, next) => authController.getMe(req, res, next));
authRouter.post('/change-password', authGuard, (req, res, next) => authController.changePassword(req, res, next));
authRouter.post('/logout', authGuard, (req, res, next) => authController.logout(req, res, next));
