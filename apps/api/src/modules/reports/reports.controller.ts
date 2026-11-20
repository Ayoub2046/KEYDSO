import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { ReportFilterQuerySchema, AuditExportQuerySchema } from '@keydso/validation';
import { AuthenticatedUser } from '../../security/auth.guard';

export class ReportsController {
  private reportsService: ReportsService;

  constructor() {
    this.reportsService = new ReportsService();
  }

  public getFinancialOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      const query = ReportFilterQuerySchema.parse(req.query);
      const data = await this.reportsService.getFinancialOverview(query, user);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public getFacultyPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      const query = ReportFilterQuerySchema.parse(req.query);
      const data = await this.reportsService.getFacultyPerformance(query, user);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public getCommitteeGovernanceAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.reportsService.getCommitteeGovernanceAnalytics();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public generateAuditExport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      const query = AuditExportQuerySchema.parse(req.query);
      const data = await this.reportsService.generateAuditExport(query, user);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };

  public exportFinancialCsv = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthenticatedUser;
      const query = ReportFilterQuerySchema.parse(req.query);
      const csvData = await this.reportsService.exportFinancialCsv(query, user);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="keydso_financial_audit_${new Date().toISOString().substring(0, 10)}.csv"`
      );
      res.send(csvData);
    } catch (error) {
      next(error);
    }
  };
}
