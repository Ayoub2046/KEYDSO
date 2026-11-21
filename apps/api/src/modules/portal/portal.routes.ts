import { Router } from 'express';
import { portalController } from './portal.controller';
import { authGuard } from '../../security/auth.guard';

export const portalRouter = Router();

// Public routes for landing page / visitors
portalRouter.get('/landing-settings', (req, res, next) => portalController.getLandingSettings(req, res, next));
portalRouter.put('/landing-settings', (req, res, next) => portalController.updateLandingSettings(req, res, next));

// Protected student portal routes
portalRouter.use(authGuard);

portalRouter.get('/overview', (req, res, next) => portalController.getOverview(req, res, next));
portalRouter.get('/representatives', (req, res, next) => portalController.getRepresentatives(req, res, next));
portalRouter.get('/receipts/:receiptNumber', (req, res, next) => portalController.getReceipt(req, res, next));
portalRouter.post('/feedback', (req, res, next) => portalController.submitFeedback(req, res, next));
portalRouter.get('/transparency', (req, res, next) => portalController.getTransparencyFeed(req, res, next));
portalRouter.get('/announcements', (req, res, next) => portalController.getAnnouncements(req, res, next));
