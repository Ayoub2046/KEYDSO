import { Request, Response, NextFunction } from 'express';
import { governanceService } from './governance.service';
import { sendSuccess } from '../../common/response';
import {
  CreateCommitteeSchema,
  AssignCommitteeMemberSchema,
  CreateCommitteeTaskSchema,
  UpdateCommitteeTaskStatusSchema,
  CreateMeetingRequestSchema,
  ReviewMeetingRequestSchema,
  RecordMeetingMinutesSchema,
  CreateIssueReportSchema,
  UpdateIssueStatusSchema,
  ResolveIssueSchema,
} from '@keydso/validation';
import { RoleName } from '@keydso/shared-types';

export class GovernanceController {
  // ---------------------------------------------------------------------------
  // COMMITTEES
  // ---------------------------------------------------------------------------
  public async getCommittees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const academicYearId = req.query.academic_year_id as string | undefined;
      const facultyId = req.query.faculty_id as string | undefined;
      const committees = await governanceService.getCommittees(academicYearId, facultyId);
      sendSuccess(res, committees, 'Committees retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async getCommitteeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const committee = await governanceService.getCommitteeById(req.params.id);
      sendSuccess(res, committee, 'Committee details retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createCommittee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateCommitteeSchema.parse(req.body);
      const committee = await governanceService.createCommittee(validated, req.user!.id);
      sendSuccess(res, committee, 'Committee created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  public async assignMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AssignCommitteeMemberSchema.parse(req.body);
      const membership = await governanceService.assignCommitteeMember(
        req.params.id,
        validated,
        req.user!.id
      );
      sendSuccess(res, membership, 'Committee member assigned', 201);
    } catch (err) {
      next(err);
    }
  }

  public async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await governanceService.removeCommitteeMember(
        req.params.id,
        req.params.userId,
        req.user!.id
      );
      sendSuccess(res, result, 'Committee member removed');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // COMMITTEE TASKS
  // ---------------------------------------------------------------------------
  public async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const committeeId = req.query.committee_id as string | undefined;
      const assignedTo = req.query.assigned_to as string | undefined;
      const tasks = await governanceService.getCommitteeTasks(committeeId, assignedTo);
      sendSuccess(res, tasks, 'Tasks retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateCommitteeTaskSchema.parse(req.body);
      const task = await governanceService.createCommitteeTask(validated, req.user!.id);
      sendSuccess(res, task, 'Committee task assigned', 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateTaskStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateCommitteeTaskStatusSchema.parse(req.body);
      const task = await governanceService.updateCommitteeTaskStatus(
        req.params.id,
        validated,
        req.user!.id
      );
      sendSuccess(res, task, 'Task status updated');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // MEETINGS & TRAINING
  // ---------------------------------------------------------------------------
  public async getMeetings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academic_year_id, faculty_id, committee_id, status } = req.query as Record<
        string,
        string | undefined
      >;
      const meetings = await governanceService.getMeetings({
        academicYearId: academic_year_id,
        facultyId: faculty_id,
        committeeId: committee_id,
        status,
      });
      sendSuccess(res, meetings, 'Meetings retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateMeetingRequestSchema.parse(req.body);
      const meeting = await governanceService.createMeetingRequest(validated, req.user!.id);
      sendSuccess(res, meeting, 'Meeting requested for presidential approval', 201);
    } catch (err) {
      next(err);
    }
  }

  public async reviewMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReviewMeetingRequestSchema.parse(req.body);
      const meeting = await governanceService.reviewMeetingRequest(
        req.params.id,
        validated,
        req.user!.id
      );
      sendSuccess(res, meeting, `Meeting request ${meeting.status.toLowerCase()}`);
    } catch (err) {
      next(err);
    }
  }

  public async recordMinutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RecordMeetingMinutesSchema.parse(req.body);
      const meeting = await governanceService.recordMeetingMinutes(
        req.params.id,
        validated,
        req.user!.id
      );
      sendSuccess(res, meeting, 'Official minutes and resolutions recorded');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // FACULTY CHALLENGES & ISSUES
  // ---------------------------------------------------------------------------
  public async getIssues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { faculty_id, status, category, priority } = req.query as Record<string, string | undefined>;
      const issues = await governanceService.getIssueReports(
        req.user!.id,
        req.user!.roles as RoleName[],
        (req.user as any).assigned_faculty_id,
        { facultyId: faculty_id, status, category, priority }
      );
      sendSuccess(res, issues, 'Issue reports retrieved');
    } catch (err) {
      next(err);
    }
  }

  public async createIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateIssueReportSchema.parse(req.body);
      const issue = await governanceService.createIssueReport(validated, req.user!.id);
      sendSuccess(res, issue, 'Issue registered with reference number ' + issue.reference_number, 201);
    } catch (err) {
      next(err);
    }
  }

  public async updateIssueStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateIssueStatusSchema.parse(req.body);
      const issue = await governanceService.updateIssueStatus(
        req.params.id,
        validated,
        req.user!.id,
        req.user!.roles as RoleName[],
        (req.user as any).assigned_faculty_id
      );
      sendSuccess(res, issue, 'Issue status updated');
    } catch (err) {
      next(err);
    }
  }

  public async resolveIssue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ResolveIssueSchema.parse(req.body);
      const issue = await governanceService.resolveIssue(
        req.params.id,
        validated,
        req.user!.id,
        req.user!.roles as RoleName[],
        (req.user as any).assigned_faculty_id
      );
      sendSuccess(res, issue, 'Issue resolved and marked completed');
    } catch (err) {
      next(err);
    }
  }

  // ---------------------------------------------------------------------------
  // COUNCIL DASHBOARD
  // ---------------------------------------------------------------------------
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overview = await governanceService.getCouncilDashboard(
        req.user!.id,
        req.user!.roles as RoleName[],
        (req.user as any).assigned_faculty_id
      );
      sendSuccess(res, overview, 'Council dashboard overview loaded');
    } catch (err) {
      next(err);
    }
  }
}

export const governanceController = new GovernanceController();
