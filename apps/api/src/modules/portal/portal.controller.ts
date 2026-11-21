import { Request, Response, NextFunction } from 'express';
import { portalService } from './portal.service';
import { sendSuccess } from '../../common/response';
import { StudentFeedbackSchema, LandingSettingsSchema } from '@keydso/validation';

export class PortalController {
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await portalService.getPortalOverview(req.user!.id);
      sendSuccess(res, overview, 'Student portal overview loaded');
    } catch (err) {
      next(err);
    }
  }

  public async getRepresentatives(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyId = req.query.faculty_id as string | undefined;
      const reps = await portalService.getRepresentatives(facultyId);
      sendSuccess(res, reps, 'Representatives retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const receipt = await portalService.getReceiptByNumber(req.params.receiptNumber, req.user!.id);
      sendSuccess(res, receipt, 'Receipt retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = StudentFeedbackSchema.parse(req.body);
      const issue = await portalService.submitFeedback(validated, req.user!.id);
      sendSuccess(res, issue, 'Feedback submitted to representative council', 201);
    } catch (err) {
      next(err);
    }
  }

  public async getTransparencyFeed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const feed = await portalService.getPublicTransparencyFeed();
      sendSuccess(res, feed, 'Public transparency feed retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcements = await portalService.getAnnouncements();
      sendSuccess(res, announcements, 'Announcements retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async getLandingSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await portalService.getLandingSettings();
      sendSuccess(res, settings, 'Landing page settings retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async updateLandingSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LandingSettingsSchema.parse(req.body);
      const settings = await portalService.updateLandingSettings(validated);
      sendSuccess(res, settings, 'Landing page settings updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const portalController = new PortalController();
