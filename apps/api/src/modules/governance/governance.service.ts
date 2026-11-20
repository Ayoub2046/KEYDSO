import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { recordAudit } from '../../database/audit';
import { ConflictError, NotFoundError, BadRequestError, ForbiddenError } from '../../common/errors';
import {
  CreateCommitteeInput,
  AssignCommitteeMemberInput,
  CreateCommitteeTaskInput,
  UpdateCommitteeTaskStatusInput,
  CreateMeetingRequestInput,
  ReviewMeetingRequestInput,
  RecordMeetingMinutesInput,
  CreateIssueReportInput,
  UpdateIssueStatusInput,
  ResolveIssueInput,
} from '@keydso/validation';
import { RoleName } from '@keydso/shared-types';

export class GovernanceService {
  // ==========================================================================
  // COMMITTEES
  // ==========================================================================
  public async getCommittees(academicYearId?: string, facultyId?: string) {
    if (db instanceof InMemoryDatabase) {
      let list = [...db.committees];
      if (academicYearId) list = list.filter((c) => c.academic_year_id === academicYearId);
      if (facultyId) list = list.filter((c) => c.faculty_id === facultyId);

      return list.map((comm) => {
        const chair = db.profiles.find((p) => p.id === comm.chairperson_id);
        const fac = db.faculties.find((f) => f.id === comm.faculty_id);
        const members = db.committeeMemberships.filter((m) => m.committee_id === comm.id);
        const tasks = db.committeeTasks.filter((t) => t.committee_id === comm.id);

        return {
          ...comm,
          chairperson_name: chair?.full_name,
          faculty_name: fac?.name,
          member_count: members.length,
          task_count: tasks.length,
        };
      });
    }

    const res = await db.query(`
      SELECT c.*, p.full_name AS chairperson_name, f.name AS faculty_name,
             COUNT(DISTINCT m.id) AS member_count,
             COUNT(DISTINCT t.id) AS task_count
      FROM committees c
      LEFT JOIN profiles p ON p.id = c.chairperson_id
      LEFT JOIN faculties f ON f.id = c.faculty_id
      LEFT JOIN committee_memberships m ON m.committee_id = c.id
      LEFT JOIN committee_tasks t ON t.committee_id = c.id
      GROUP BY c.id, p.full_name, f.name
      ORDER BY c.created_at DESC
    `);
    return res.rows;
  }

  public async getCommitteeById(id: string) {
    if (db instanceof InMemoryDatabase) {
      const comm = db.committees.find((c) => c.id === id);
      if (!comm) throw new NotFoundError('Committee not found');

      const chair = db.profiles.find((p) => p.id === comm.chairperson_id);
      const fac = db.faculties.find((f) => f.id === comm.faculty_id);
      const rawMembers = db.committeeMemberships.filter((m) => m.committee_id === comm.id);
      const members = rawMembers.map((m) => {
        const prof = db.profiles.find((p) => p.id === m.user_id);
        return {
          ...m,
          user_name: prof?.full_name,
          user_email: prof?.email,
        };
      });
      const tasks = db.committeeTasks.filter((t) => t.committee_id === comm.id);

      return {
        ...comm,
        chairperson_name: chair?.full_name,
        faculty_name: fac?.name,
        member_count: members.length,
        task_count: tasks.length,
        members,
        tasks,
      };
    }

    throw new Error('Real db implementation');
  }

  public async createCommittee(input: CreateCommitteeInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const dup = db.committees.find((c) => c.code.toUpperCase() === input.code.toUpperCase());
      if (dup) {
        throw new ConflictError(`Committee with code '${input.code}' already exists`);
      }

      const committee = {
        id: crypto.randomUUID(),
        ...input,
        code: input.code.toUpperCase(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.committees.push(committee);

      // If chairperson designated, auto-add as committee member
      if (input.chairperson_id) {
        db.committeeMemberships.push({
          id: crypto.randomUUID(),
          committee_id: committee.id,
          user_id: input.chairperson_id,
          role_in_committee: 'CHAIRPERSON',
          joined_at: new Date().toISOString(),
        });
      }

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_COMMITTEE',
        entity_type: 'COMMITTEE',
        entity_id: committee.id,
        new_state: committee,
      });

      return committee;
    }

    throw new Error('Real db implementation');
  }

  public async assignCommitteeMember(
    committeeId: string,
    input: AssignCommitteeMemberInput,
    actorId: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const comm = db.committees.find((c) => c.id === committeeId);
      if (!comm) throw new NotFoundError('Committee not found');

      const user = db.profiles.find((p) => p.id === input.user_id);
      if (!user) throw new NotFoundError('User profile not found');

      const existing = db.committeeMemberships.find(
        (m) => m.committee_id === committeeId && m.user_id === input.user_id
      );
      if (existing) {
        throw new ConflictError('User is already assigned to this committee');
      }

      const membership = {
        id: crypto.randomUUID(),
        committee_id: committeeId,
        user_id: input.user_id,
        role_in_committee: input.role_in_committee || 'MEMBER',
        joined_at: new Date().toISOString(),
      };
      db.committeeMemberships.push(membership);

      await recordAudit({
        actor_id: actorId,
        action: 'ASSIGN_COMMITTEE_MEMBER',
        entity_type: 'COMMITTEE',
        entity_id: committeeId,
        new_state: membership,
      });

      return membership;
    }

    throw new Error('Real db implementation');
  }

  public async removeCommitteeMember(committeeId: string, userId: string, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const idx = db.committeeMemberships.findIndex(
        (m) => m.committee_id === committeeId && m.user_id === userId
      );
      if (idx === -1) throw new NotFoundError('Committee membership not found');

      db.committeeMemberships.splice(idx, 1);

      await recordAudit({
        actor_id: actorId,
        action: 'REMOVE_COMMITTEE_MEMBER',
        entity_type: 'COMMITTEE',
        entity_id: committeeId,
        new_state: { removed_user_id: userId },
      });

      return { removed: true };
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // COMMITTEE TASKS
  // ==========================================================================
  public async getCommitteeTasks(committeeId?: string, assignedTo?: string) {
    if (db instanceof InMemoryDatabase) {
      let list = [...db.committeeTasks];
      if (committeeId) list = list.filter((t) => t.committee_id === committeeId);
      if (assignedTo) list = list.filter((t) => t.assigned_to === assignedTo);

      return list.map((task) => {
        const comm = db.committees.find((c) => c.id === task.committee_id);
        const assignee = db.profiles.find((p) => p.id === task.assigned_to);
        return {
          ...task,
          committee_name: comm?.name,
          assigned_to_name: assignee?.full_name,
        };
      });
    }

    throw new Error('Real db implementation');
  }

  public async createCommitteeTask(input: CreateCommitteeTaskInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const comm = db.committees.find((c) => c.id === input.committee_id);
      if (!comm) throw new NotFoundError('Committee not found');

      const task = {
        id: crypto.randomUUID(),
        ...input,
        status: 'TODO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.committeeTasks.push(task);

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_COMMITTEE_TASK',
        entity_type: 'TASK',
        entity_id: task.id,
        new_state: task,
      });

      return task;
    }

    throw new Error('Real db implementation');
  }

  public async updateCommitteeTaskStatus(
    taskId: string,
    input: UpdateCommitteeTaskStatusInput,
    actorId: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const task = db.committeeTasks.find((t) => t.id === taskId);
      if (!task) throw new NotFoundError('Task not found');

      task.status = input.status;
      task.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'UPDATE_TASK_STATUS',
        entity_type: 'TASK',
        entity_id: task.id,
        new_state: { status: input.status },
      });

      return task;
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // MEETINGS & TRAINING SESSIONS
  // ==========================================================================
  public async getMeetings(filters: {
    academicYearId?: string;
    facultyId?: string;
    committeeId?: string;
    status?: string;
  }) {
    if (db instanceof InMemoryDatabase) {
      let list = [...db.meetings];
      if (filters.academicYearId) list = list.filter((m) => m.academic_year_id === filters.academicYearId);
      if (filters.facultyId) list = list.filter((m) => m.faculty_id === filters.facultyId);
      if (filters.committeeId) list = list.filter((m) => m.committee_id === filters.committeeId);
      if (filters.status) list = list.filter((m) => m.status === filters.status);

      return list.map((m) => {
        const fac = db.faculties.find((f) => f.id === m.faculty_id);
        const comm = db.committees.find((c) => c.id === m.committee_id);
        const req = db.profiles.find((p) => p.id === m.requested_by);
        const appr = db.profiles.find((p) => p.id === m.approved_by);

        return {
          ...m,
          faculty_name: fac?.name,
          committee_name: comm?.name,
          requester_name: req?.full_name,
          approver_name: appr?.full_name,
        };
      });
    }

    throw new Error('Real db implementation');
  }

  public async createMeetingRequest(input: CreateMeetingRequestInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const meeting = {
        id: crypto.randomUUID(),
        ...input,
        requested_by: actorId,
        status: 'REQUESTED',
        approved_by: null,
        rejection_reason: null,
        minutes: null,
        official_resolutions: null,
        attendance_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.meetings.push(meeting);

      await recordAudit({
        actor_id: actorId,
        action: 'REQUEST_MEETING',
        entity_type: 'MEETING',
        entity_id: meeting.id,
        new_state: meeting,
      });

      return meeting;
    }

    throw new Error('Real db implementation');
  }

  public async reviewMeetingRequest(
    meetingId: string,
    input: ReviewMeetingRequestInput,
    actorId: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const meeting = db.meetings.find((m) => m.id === meetingId);
      if (!meeting) throw new NotFoundError('Meeting not found');

      if (meeting.status !== 'REQUESTED') {
        throw new BadRequestError(`Cannot review meeting in '${meeting.status}' status`);
      }

      meeting.status = input.status;
      meeting.approved_by = input.status === 'APPROVED' ? actorId : null;
      meeting.rejection_reason = input.status === 'REJECTED' ? input.rejection_reason || 'Rejected by council' : null;
      meeting.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: `REVIEW_MEETING_${input.status}`,
        entity_type: 'MEETING',
        entity_id: meeting.id,
        new_state: { status: input.status, approved_by: meeting.approved_by },
      });

      return meeting;
    }

    throw new Error('Real db implementation');
  }

  public async recordMeetingMinutes(
    meetingId: string,
    input: RecordMeetingMinutesInput,
    actorId: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const meeting = db.meetings.find((m) => m.id === meetingId);
      if (!meeting) throw new NotFoundError('Meeting not found');

      if (meeting.status !== 'APPROVED' && meeting.status !== 'COMPLETED') {
        throw new BadRequestError('Minutes can only be recorded for APPROVED or COMPLETED meetings');
      }

      meeting.minutes = input.minutes;
      meeting.official_resolutions = input.official_resolutions || null;
      meeting.attendance_count = input.attendance_count;
      meeting.status = 'COMPLETED';
      meeting.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'RECORD_MEETING_MINUTES',
        entity_type: 'MEETING',
        entity_id: meeting.id,
        new_state: {
          status: 'COMPLETED',
          minutes_length: input.minutes.length,
          attendance_count: input.attendance_count,
        },
      });

      return meeting;
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // FACULTY CHALLENGES & ISSUES (Cross-Faculty Boundary Enforced)
  // ==========================================================================
  public async getIssueReports(
    actorId: string,
    userRoles: RoleName[],
    userFacultyId?: string,
    filters?: {
      facultyId?: string;
      status?: string;
      category?: string;
      priority?: string;
    }
  ) {
    const isExecutive =
      userRoles.includes(RoleName.GENERAL_PRESIDENT) ||
      userRoles.includes(RoleName.VICE_PRESIDENT) ||
      userRoles.includes(RoleName.SECRETARY) ||
      userRoles.includes(RoleName.SYSTEM_ADMIN);

    const isFacultyPres = userRoles.includes(RoleName.FACULTY_PRESIDENT);

    // Cross-Faculty Isolation Guard:
    // Faculty Presidents can NEVER access another faculty's private issues
    if (isFacultyPres && !isExecutive) {
      if (!userFacultyId) {
        throw new ForbiddenError('No assigned faculty found for this faculty representative.');
      }
      if (filters?.facultyId && filters.facultyId !== userFacultyId) {
        throw new ForbiddenError(
          'Cross-Faculty Security Violation: Faculty Presidents may only view challenges originating in their own assigned faculty.'
        );
      }
    }

    if (db instanceof InMemoryDatabase) {
      let list = [...db.issueReports];

      // Scoping:
      if (isFacultyPres && !isExecutive) {
        list = list.filter((i) => i.faculty_id === userFacultyId);
      } else if (filters?.facultyId) {
        list = list.filter((i) => i.faculty_id === filters.facultyId);
      }

      if (filters?.status) list = list.filter((i) => i.status === filters.status);
      if (filters?.category) list = list.filter((i) => i.category === filters.category);
      if (filters?.priority) list = list.filter((i) => i.priority === filters.priority);

      return list.map((issue) => {
        const fac = db.faculties.find((f) => f.id === issue.faculty_id);
        const dept = db.departments.find((d) => d.id === issue.department_id);
        const reporter = db.profiles.find((p) => p.id === issue.reported_by);
        const assignee = db.profiles.find((p) => p.id === issue.assigned_to);

        return {
          ...issue,
          faculty_name: fac?.name,
          department_name: dept?.name,
          reporter_name: reporter?.full_name,
          assigned_to_name: assignee?.full_name,
        };
      });
    }

    throw new Error('Real db implementation');
  }

  public async createIssueReport(input: CreateIssueReportInput, actorId: string) {
    if (db instanceof InMemoryDatabase) {
      const fac = db.faculties.find((f) => f.id === input.faculty_id);
      if (!fac) throw new NotFoundError('Faculty not found');

      const refNo = `ISS-${new Date().getFullYear()}-${String(db.issueReports.length + 1).padStart(4, '0')}`;

      const issue = {
        id: crypto.randomUUID(),
        reference_number: refNo,
        ...input,
        reported_by: actorId,
        assigned_to: null,
        status: 'SUBMITTED',
        resolution_notes: null,
        resolved_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.issueReports.push(issue);

      await recordAudit({
        actor_id: actorId,
        action: 'CREATE_ISSUE_REPORT',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        new_state: { reference_number: refNo, category: input.category, priority: input.priority },
      });

      return issue;
    }

    throw new Error('Real db implementation');
  }

  public async updateIssueStatus(
    issueId: string,
    input: UpdateIssueStatusInput,
    actorId: string,
    userRoles: RoleName[],
    userFacultyId?: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const issue = db.issueReports.find((i) => i.id === issueId);
      if (!issue) throw new NotFoundError('Issue report not found');

      const isExecutive =
        userRoles.includes(RoleName.GENERAL_PRESIDENT) ||
        userRoles.includes(RoleName.VICE_PRESIDENT) ||
        userRoles.includes(RoleName.SECRETARY) ||
        userRoles.includes(RoleName.SYSTEM_ADMIN);

      const isFacultyPres = userRoles.includes(RoleName.FACULTY_PRESIDENT);

      // Boundary check for faculty president
      if (isFacultyPres && !isExecutive) {
        if (issue.faculty_id !== userFacultyId) {
          throw new ForbiddenError(
            'Cross-Faculty Security Violation: You cannot modify issues from another faculty.'
          );
        }
      }

      issue.status = input.status;
      if (input.assigned_to !== undefined) {
        issue.assigned_to = input.assigned_to;
      }
      issue.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'UPDATE_ISSUE_STATUS',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        new_state: { status: input.status, assigned_to: issue.assigned_to },
      });

      return issue;
    }

    throw new Error('Real db implementation');
  }

  public async resolveIssue(
    issueId: string,
    input: ResolveIssueInput,
    actorId: string,
    userRoles: RoleName[],
    userFacultyId?: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const issue = db.issueReports.find((i) => i.id === issueId);
      if (!issue) throw new NotFoundError('Issue report not found');

      const isExecutive =
        userRoles.includes(RoleName.GENERAL_PRESIDENT) ||
        userRoles.includes(RoleName.VICE_PRESIDENT) ||
        userRoles.includes(RoleName.SECRETARY) ||
        userRoles.includes(RoleName.SYSTEM_ADMIN);

      const isFacultyPres = userRoles.includes(RoleName.FACULTY_PRESIDENT);

      if (isFacultyPres && !isExecutive) {
        if (issue.faculty_id !== userFacultyId) {
          throw new ForbiddenError(
            'Cross-Faculty Security Violation: You cannot resolve issues from another faculty.'
          );
        }
      }

      issue.status = 'RESOLVED';
      issue.resolution_notes = input.resolution_notes;
      issue.resolved_at = new Date().toISOString();
      issue.updated_at = new Date().toISOString();

      await recordAudit({
        actor_id: actorId,
        action: 'RESOLVE_ISSUE',
        entity_type: 'ISSUE',
        entity_id: issue.id,
        new_state: { status: 'RESOLVED', resolved_at: issue.resolved_at },
      });

      return issue;
    }

    throw new Error('Real db implementation');
  }

  // ==========================================================================
  // COUNCIL DASHBOARD OVERVIEW
  // ==========================================================================
  public async getCouncilDashboard(
    actorId: string,
    userRoles: RoleName[],
    userFacultyId?: string
  ) {
    if (db instanceof InMemoryDatabase) {
      const totalStudents = db.students.length;
      const totalFaculties = db.faculties.length;
      const activeCampaigns = db.campaigns.filter((c) => c.status === 'ACTIVE').length;
      const totalFundsBalance = db.funds.reduce((acc, f) => acc + Number(f.current_balance || 0), 0);
      const activeCommittees = db.committees.filter((c) => c.is_active).length;

      let issues = [...db.issueReports];
      const isExecutive =
        userRoles.includes(RoleName.GENERAL_PRESIDENT) ||
        userRoles.includes(RoleName.VICE_PRESIDENT) ||
        userRoles.includes(RoleName.SYSTEM_ADMIN);

      if (!isExecutive && userFacultyId) {
        issues = issues.filter((i) => i.faculty_id === userFacultyId);
      }

      const openChallenges = issues.filter(
        (i) => i.status === 'SUBMITTED' || i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED'
      ).length;

      const pendingMeetings = db.meetings.filter((m) => m.status === 'REQUESTED').length;
      const pendingExpenses = db.expenses.filter((e) => e.status === 'REQUESTED').length;

      const recentChallenges = issues.slice(0, 5).map((i) => {
        const fac = db.faculties.find((f) => f.id === i.faculty_id);
        return { ...i, faculty_name: fac?.name };
      });

      const upcomingMeetings = db.meetings
        .filter((m) => m.status === 'APPROVED' || m.status === 'REQUESTED')
        .slice(0, 5)
        .map((m) => {
          const fac = db.faculties.find((f) => f.id === m.faculty_id);
          return { ...m, faculty_name: fac?.name };
        });

      return {
        total_students: totalStudents,
        total_faculties: totalFaculties,
        active_campaigns_count: activeCampaigns,
        total_funds_balance: totalFundsBalance,
        active_committees_count: activeCommittees,
        open_challenges_count: openChallenges,
        pending_meetings_count: pendingMeetings,
        pending_expenses_count: pendingExpenses,
        recent_challenges: recentChallenges,
        upcoming_meetings: upcomingMeetings,
      };
    }

    throw new Error('Real db implementation');
  }
}

export const governanceService = new GovernanceService();
