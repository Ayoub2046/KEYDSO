import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { sendSuccess, sendPaginated } from '../../common/response';
import { AssignFacultyRepSchema, LandingSettingsSchema } from '@keydso/validation';

export class AdminController {
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.getUsers();
      sendSuccess(res, users, 'Users retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.createUser(req.body, req.user!.id);
      sendSuccess(res, user, 'User created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public async assignFacultyRepresentative(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AssignFacultyRepSchema.parse(req.body);
      const assignment = await adminService.assignFacultyRepresentative(validated, req.user!.id);
      sendSuccess(res, assignment, 'Faculty representative assigned successfully');
    } catch (err) {
      next(err);
    }
  }

  public async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.page_size ? parseInt(req.query.page_size as string, 10) : 30;
      const { items, total } = await adminService.getAuditLogs(page, pageSize);
      sendPaginated(res, items, total, page, pageSize, 'Audit logs retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async updateLandingSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LandingSettingsSchema.parse(req.body);
      const settings = await adminService.updateLandingSettings(validated, req.user!.id);
      sendSuccess(res, settings, 'Landing page settings updated successfully');
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
