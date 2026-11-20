import crypto from 'crypto';
import { db, InMemoryDatabase } from '../../database/db';
import { ForbiddenError } from '../../common/errors';
import { AuthenticatedUser } from '../../security/auth.guard';
import {
  RoleName,
  FinancialAnalyticsOverview,
  FacultyPerformanceReport,
  CommitteeGovernanceAnalytics,
  AuditExportReport,
  CampaignAnalyticsItem,
  FacultyCollectionItem,
  ExpenseCategoryBreakdown,
  CashflowTrendItem,
} from '@keydso/shared-types';
import { ReportFilterQueryInput, AuditExportQueryInput } from '@keydso/validation';

export class ReportsService {
  private getDb(): InMemoryDatabase {
    return db as unknown as InMemoryDatabase;
  }

  /**
   * Check if user is allowed to access institutional reports
   */
  public checkInstitutionalAccess(user: AuthenticatedUser) {
    const allowed = [
      RoleName.SYSTEM_ADMIN,
      RoleName.GENERAL_PRESIDENT,
      RoleName.VICE_PRESIDENT,
      RoleName.FINANCE_OFFICER,
      RoleName.SECRETARY,
    ];
    return user.roles.some((r) => allowed.includes(r as RoleName));
  }

  /**
   * Generates comprehensive institutional financial analytics overview
   */
  public async getFinancialOverview(
    query: ReportFilterQueryInput,
    user: AuthenticatedUser
  ): Promise<FinancialAnalyticsOverview> {
    const isInstAllowed = this.checkInstitutionalAccess(user);
    const isFacultyPres = user.roles.includes(RoleName.FACULTY_PRESIDENT);

    if (!isInstAllowed && !isFacultyPres) {
      throw new ForbiddenError('Unauthorized: Access to financial analytics requires executive or finance privileges');
    }

    const dbInstance = this.getDb();
    let obligations = [...dbInstance.obligations];
    let payments = dbInstance.payments.filter((p) => p.status === 'VERIFIED');
    let expenses = dbInstance.expenses.filter((e) => ['DISBURSED', 'RECONCILED'].includes(e.status));
    let supportCases = dbInstance.supportCases.filter((s) => s.status === 'DISBURSED');

    // Faculty filtering if requested or if user is Faculty President
    let targetFacultyId = query.faculty_id;
    if (isFacultyPres && !isInstAllowed) {
      if (!user.assigned_faculty_id) {
        throw new ForbiddenError('Faculty President has no assigned faculty');
      }
      targetFacultyId = user.assigned_faculty_id;
    }

    if (targetFacultyId) {
      const facultyStudents = new Set(
        dbInstance.students.filter((s) => s.faculty_id === targetFacultyId).map((s) => s.id)
      );
      obligations = obligations.filter((o) => facultyStudents.has(o.student_id));
      payments = payments.filter((p) => facultyStudents.has(p.student_id));
    }

    // Date filtering if provided
    if (query.start_date) {
      payments = payments.filter((p) => p.payment_date >= query.start_date!);
    }
    if (query.end_date) {
      payments = payments.filter((p) => p.payment_date <= query.end_date!);
    }

    const total_expected_revenue = obligations.reduce((acc, o) => acc + (o.expected_amount || 0), 0);
    const total_collected_revenue = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const collection_rate_percentage =
      total_expected_revenue > 0 ? Number(((total_collected_revenue / total_expected_revenue) * 100).toFixed(2)) : 0;

    const total_expenses_disbursed = expenses.reduce((acc, e) => acc + (e.approved_amount || 0), 0);
    const total_welfare_disbursed = supportCases.reduce((acc, s) => acc + (s.approved_amount || 0), 0);

    // Outstanding debt
    const total_outstanding_debt = obligations.reduce((acc, o) => {
      const remaining =
        (o.expected_amount || 0) -
        (o.verified_paid_amount || 0) -
        (o.waived_amount || 0) -
        (o.sponsored_amount || 0);
      return acc + (remaining > 0 ? remaining : 0);
    }, 0);

    // Net available cash in active funds
    const net_available_cash = dbInstance.funds.reduce((acc, f) => acc + (f.current_balance || 0), 0);

    const total_verified_transactions = payments.length;
    const total_pending_verifications = dbInstance.payments.filter((p) => p.status === 'PENDING').length;

    // Campaign breakdown
    const campaign_breakdown: CampaignAnalyticsItem[] = dbInstance.campaigns.map((camp) => {
      const campObs = dbInstance.obligations.filter((o) => o.campaign_id === camp.id);
      const campPayments = dbInstance.payments.filter((p) => p.campaign_id === camp.id && p.status === 'VERIFIED');

      const expected = campObs.reduce((sum, o) => sum + (o.expected_amount || 0), 0);
      const collected = campPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const rate = expected > 0 ? Number(((collected / expected) * 100).toFixed(2)) : 0;

      const studentIdsWithObligations = new Set(campObs.map((o) => o.student_id));
      const paidStudentIds = new Set(campPayments.map((p) => p.student_id));

      return {
        campaign_id: camp.id,
        title: camp.title,
        type: camp.campaign_type,
        target_amount: camp.target_amount,
        collected_amount: collected,
        collection_rate: rate,
        student_count: studentIdsWithObligations.size,
        paid_student_count: paidStudentIds.size,
        status: camp.status,
      };
    });

    // Faculty collection breakdown
    const faculty_collection_breakdown: FacultyCollectionItem[] = dbInstance.faculties.map((fac) => {
      const facStudents = dbInstance.students.filter((s) => s.faculty_id === fac.id);
      const facStudentIds = new Set(facStudents.map((s) => s.id));

      const facObs = dbInstance.obligations.filter((o) => facStudentIds.has(o.student_id));
      const facPayments = dbInstance.payments.filter(
        (p) => facStudentIds.has(p.student_id) && p.status === 'VERIFIED'
      );

      const expected = facObs.reduce((sum, o) => sum + (o.expected_amount || 0), 0);
      const collected = facPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const rate = expected > 0 ? Number(((collected / expected) * 100).toFixed(2)) : 0;
      const outstanding = expected > collected ? expected - collected : 0;

      return {
        faculty_id: fac.id,
        faculty_name: fac.name,
        faculty_code: fac.code,
        total_students: facStudents.length,
        expected_amount: expected,
        collected_amount: collected,
        collection_rate: rate,
        outstanding_amount: outstanding,
      };
    });

    // Expense category breakdown
    const categoryTotals: Record<string, { total: number; count: number }> = {
      INFRASTRUCTURE: { total: 0, count: 0 },
      ACADEMIC_EVENTS: { total: 0, count: 0 },
      WELFARE_SUPPORT: { total: total_welfare_disbursed, count: supportCases.length },
      OFFICE_OPERATIONS: { total: 0, count: 0 },
      OTHER: { total: 0, count: 0 },
    };

    expenses.forEach((e) => {
      const desc = (e.title + ' ' + (e.purpose || '')).toLowerCase();
      let cat = 'OTHER';
      if (desc.includes('lab') || desc.includes('switch') || desc.includes('cable') || desc.includes('infrastructure') || desc.includes('wifi')) {
        cat = 'INFRASTRUCTURE';
      } else if (desc.includes('event') || desc.includes('hackathon') || desc.includes('workshop') || desc.includes('academic')) {
        cat = 'ACADEMIC_EVENTS';
      } else if (desc.includes('office') || desc.includes('printing') || desc.includes('supplies')) {
        cat = 'OFFICE_OPERATIONS';
      }
      categoryTotals[cat].total += e.approved_amount || 0;
      categoryTotals[cat].count += 1;
    });

    const totalAllDisbursements = total_expenses_disbursed + total_welfare_disbursed;
    const expense_category_breakdown: ExpenseCategoryBreakdown[] = Object.entries(categoryTotals)
      .map(([category, { total, count }]) => ({
        category,
        total_amount: Number(total.toFixed(2)),
        percentage: totalAllDisbursements > 0 ? Number(((total / totalAllDisbursements) * 100).toFixed(1)) : 0,
        count,
      }))
      .filter((c) => c.total_amount > 0);

    // Cashflow Trend from General Ledger
    const monthlyCashflow: Record<string, { credits: number; debits: number }> = {};
    dbInstance.ledgerEntries.forEach((entry) => {
      const period = entry.created_at.substring(0, 7); // "YYYY-MM"
      if (!monthlyCashflow[period]) {
        monthlyCashflow[period] = { credits: 0, debits: 0 };
      }
      if (entry.entry_type === 'CREDIT') {
        monthlyCashflow[period].credits += entry.amount;
      } else if (entry.entry_type === 'DEBIT') {
        monthlyCashflow[period].debits += entry.amount;
      }
    });

    const cashflow_trend: CashflowTrendItem[] = Object.entries(monthlyCashflow)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        credits: Number(data.credits.toFixed(2)),
        debits: Number(data.debits.toFixed(2)),
        net: Number((data.credits - data.debits).toFixed(2)),
      }));

    return {
      total_expected_revenue: Number(total_expected_revenue.toFixed(2)),
      total_collected_revenue: Number(total_collected_revenue.toFixed(2)),
      collection_rate_percentage,
      total_expenses_disbursed: Number(total_expenses_disbursed.toFixed(2)),
      total_welfare_disbursed: Number(total_welfare_disbursed.toFixed(2)),
      net_available_cash: Number(net_available_cash.toFixed(2)),
      total_outstanding_debt: Number(total_outstanding_debt.toFixed(2)),
      total_verified_transactions,
      total_pending_verifications,
      campaign_breakdown,
      faculty_collection_breakdown,
      expense_category_breakdown,
      cashflow_trend,
    };
  }

  /**
   * Generates Faculty Performance matrix and comparative rankings
   */
  public async getFacultyPerformance(
    query: ReportFilterQueryInput,
    user: AuthenticatedUser
  ): Promise<FacultyPerformanceReport[]> {
    const isInstAllowed = this.checkInstitutionalAccess(user);
    const isFacultyPres = user.roles.includes(RoleName.FACULTY_PRESIDENT);

    if (!isInstAllowed && !isFacultyPres) {
      throw new ForbiddenError('Unauthorized: Access requires executive or faculty representative role');
    }

    const dbInstance = this.getDb();
    let faculties = [...dbInstance.faculties];

    // If Faculty President requests specific faculty check
    if (isFacultyPres && !isInstAllowed && query.faculty_id && query.faculty_id !== user.assigned_faculty_id) {
      throw new ForbiddenError('Cross-Faculty Security Violation: You cannot access individual metrics for another faculty');
    }

    const reports: FacultyPerformanceReport[] = faculties.map((fac) => {
      const assignment = dbInstance.facultyAssignments.find(
        (a) => a.faculty_id === fac.id && a.is_active
      );
      let repName = 'Not Assigned';
      if (assignment) {
        const repProfile = dbInstance.profiles.find((p) => p.id === assignment.user_id);
        if (repProfile) repName = repProfile.full_name;
      }

      const students = dbInstance.students.filter((s) => s.faculty_id === fac.id);
      const studentIds = new Set(students.map((s) => s.id));

      const facObs = dbInstance.obligations.filter((o) => studentIds.has(o.student_id));
      const facPayments = dbInstance.payments.filter(
        (p) => studentIds.has(p.student_id) && p.status === 'VERIFIED'
      );

      const totalExpected = facObs.reduce((sum, o) => sum + (o.expected_amount || 0), 0);
      const totalCollected = facPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const collectionRate = totalExpected > 0 ? Number(((totalCollected / totalExpected) * 100).toFixed(2)) : 0;
      const outstanding = totalExpected > totalCollected ? totalExpected - totalCollected : 0;

      // Faculty challenges
      const challenges = dbInstance.issueReports.filter((i) => i.faculty_id === fac.id);
      const totalChallenges = challenges.length;
      const resolvedChallenges = challenges.filter((i) => i.status === 'RESOLVED').length;
      const resolutionRate =
        totalChallenges > 0 ? Number(((resolvedChallenges / totalChallenges) * 100).toFixed(2)) : 100.0;

      // Meetings
      const meetings = dbInstance.meetings.filter(
        (m) => m.faculty_id === fac.id && m.status === 'COMPLETED'
      );
      const meetingsConducted = meetings.length;
      const totalAttendance = meetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0);

      // Weighted composite score (0-100)
      // 45% Financial Collection Rate + 35% Issue Resolution Rate + 20% Activity/Engagement Rate
      const activityScore = Math.min(100, meetingsConducted * 30 + (totalAttendance > 0 ? 40 : 0));
      const compositeScore = Number(
        (collectionRate * 0.45 + resolutionRate * 0.35 + activityScore * 0.2).toFixed(1)
      );

      return {
        faculty_id: fac.id,
        faculty_name: fac.name,
        faculty_code: fac.code,
        dean_or_representative_name: repName,
        total_students: students.length,
        total_expected: Number(totalExpected.toFixed(2)),
        total_collected: Number(totalCollected.toFixed(2)),
        collection_rate: collectionRate,
        outstanding_balance: Number(outstanding.toFixed(2)),
        total_challenges: totalChallenges,
        resolved_challenges: resolvedChallenges,
        resolution_rate: resolutionRate,
        meetings_conducted: meetingsConducted,
        total_attendance: totalAttendance,
        performance_score: compositeScore,
      };
    });

    // Sort by performance_score descending
    return reports.sort((a, b) => b.performance_score - a.performance_score);
  }

  /**
   * Generates Committee and Governance Activity Analytics
   */
  public async getCommitteeGovernanceAnalytics(): Promise<CommitteeGovernanceAnalytics> {
    const dbInstance = this.getDb();
    const committees = dbInstance.committees.filter((c) => c.is_active);
    const memberships = dbInstance.committeeMemberships;
    const tasks = dbInstance.committeeTasks;
    const meetings = dbInstance.meetings;

    const totalActiveMembers = new Set(memberships.map((m) => m.user_id)).size;
    const totalTasksAssigned = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === 'COMPLETED').length;
    const taskCompletionRate =
      totalTasksAssigned > 0 ? Number(((tasksCompleted / totalTasksAssigned) * 100).toFixed(1)) : 0;

    const committee_breakdowns = committees.map((comm) => {
      const commMembers = memberships.filter((m) => m.committee_id === comm.id);
      const commTasks = tasks.filter((t) => t.committee_id === comm.id);
      const completedTasks = commTasks.filter((t) => t.status === 'COMPLETED').length;
      const rate = commTasks.length > 0 ? Number(((completedTasks / commTasks.length) * 100).toFixed(1)) : 0;

      let chairName = 'Not Appointed';
      if (comm.chairperson_id) {
        const chairProfile = dbInstance.profiles.find((p) => p.id === comm.chairperson_id);
        if (chairProfile) chairName = chairProfile.full_name;
      }

      return {
        committee_id: comm.id,
        name: comm.name,
        code: comm.code,
        chairperson: chairName,
        member_count: commMembers.length,
        task_count: commTasks.length,
        completed_task_count: completedTasks,
        completion_rate: rate,
      };
    });

    const completedMeetings = meetings.filter((m) => m.status === 'COMPLETED');
    const totalAttendance = completedMeetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0);
    const averageAttendance =
      completedMeetings.length > 0 ? Number((totalAttendance / completedMeetings.length).toFixed(1)) : 0;

    const meetingsByType: Record<string, number> = {};
    meetings.forEach((m) => {
      meetingsByType[m.type] = (meetingsByType[m.type] || 0) + 1;
    });

    return {
      total_committees: committees.length,
      total_active_members: totalActiveMembers,
      total_tasks_assigned: totalTasksAssigned,
      tasks_completed: tasksCompleted,
      task_completion_rate: taskCompletionRate,
      committee_breakdowns,
      meeting_analytics: {
        total_meetings: meetings.length,
        completed_meetings: completedMeetings.length,
        average_attendance: averageAttendance,
        meetings_by_type: meetingsByType,
      },
    };
  }

  /**
   * Generates high-fidelity cryptographic audit export with SHA-256 seal
   */
  public async generateAuditExport(
    query: AuditExportQueryInput,
    user: AuthenticatedUser
  ): Promise<AuditExportReport> {
    if (!this.checkInstitutionalAccess(user)) {
      throw new ForbiddenError('Unauthorized: Audit exports require executive or finance privileges');
    }

    const dbInstance = this.getDb();
    const primaryYear = dbInstance.academicYears[0];

    const totalCredits = dbInstance.ledgerEntries
      .filter((e) => e.entry_type === 'CREDIT')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalDebits = dbInstance.ledgerEntries
      .filter((e) => e.entry_type === 'DEBIT')
      .reduce((sum, e) => sum + e.amount, 0);

    const currentFundBalance = dbInstance.funds.reduce((sum, f) => sum + f.current_balance, 0);
    const reconciled = Math.abs(totalCredits - totalDebits - currentFundBalance) < 0.01;

    // Cryptographic hash over all ledger entries to guarantee immutability
    const ledgerPayload = JSON.stringify(dbInstance.ledgerEntries);
    const checksum = crypto.createHash('sha256').update(ledgerPayload).digest('hex');

    const totalVerifiedPayments = dbInstance.payments.filter((p) => p.status === 'VERIFIED').length;
    const totalExpenses = dbInstance.expenses.length;
    const totalIssues = dbInstance.issueReports.length;

    const summary: Record<string, unknown> = {
      academic_year_name: primaryYear?.name || '2025/2026',
      total_students_enrolled: dbInstance.students.length,
      total_faculties: dbInstance.faculties.length,
      verified_payments_count: totalVerifiedPayments,
      verified_payments_volume: Number(
        dbInstance.payments
          .filter((p) => p.status === 'VERIFIED')
          .reduce((sum, p) => sum + p.amount, 0)
          .toFixed(2)
      ),
      expenses_disbursed_count: dbInstance.expenses.filter((e) => e.status === 'DISBURSED' || e.status === 'RECONCILED').length,
      expenses_disbursed_volume: Number(
        dbInstance.expenses
          .filter((e) => e.status === 'DISBURSED' || e.status === 'RECONCILED')
          .reduce((sum, e) => sum + (e.approved_amount || 0), 0)
          .toFixed(2)
      ),
      welfare_cases_count: dbInstance.supportCases.length,
      welfare_disbursed_volume: Number(
        dbInstance.supportCases
          .filter((s) => s.status === 'DISBURSED')
          .reduce((sum, s) => sum + (s.approved_amount || 0), 0)
          .toFixed(2)
      ),
      active_committees_count: dbInstance.committees.filter((c) => c.is_active).length,
      total_meetings_logged: dbInstance.meetings.length,
      total_issues_reported: totalIssues,
      resolved_issues_count: dbInstance.issueReports.filter((i) => i.status === 'RESOLVED').length,
    };

    const userProfile = dbInstance.profiles.find((p) => p.id === user.id);

    return {
      generated_at: new Date().toISOString(),
      generated_by: userProfile?.full_name || user.email,
      generated_by_role: user.roles.join(', '),
      report_type: query.report_type || 'COMPREHENSIVE_AUDIT',
      academic_year: primaryYear?.name || '2025/2026',
      summary,
      ledger_verification: {
        total_credits: Number(totalCredits.toFixed(2)),
        total_debits: Number(totalDebits.toFixed(2)),
        reconciled,
        checksum,
      },
      records_count: dbInstance.ledgerEntries.length + totalVerifiedPayments + totalExpenses,
    };
  }

  /**
   * Generates downloadable CSV content for financial transactions and collection metrics
   */
  public async exportFinancialCsv(
    query: ReportFilterQueryInput,
    user: AuthenticatedUser
  ): Promise<string> {
    const overview = await this.getFinancialOverview(query, user);
    const dbInstance = this.getDb();

    const lines: string[] = [];
    lines.push('KEYDSO MAANTA - OFFICIAL FINANCIAL RECONCILIATION EXPORT');
    lines.push(`Generated At,${new Date().toISOString()}`);
    lines.push(`Generated By,${user.email}`);
    lines.push('');

    // Summary Section
    lines.push('EXECUTIVE FINANCIAL SUMMARY');
    lines.push('Metric,Value (USD)');
    lines.push(`Total Expected Revenue,${overview.total_expected_revenue}`);
    lines.push(`Total Verified Collections,${overview.total_collected_revenue}`);
    lines.push(`Collection Rate (%),${overview.collection_rate_percentage}%`);
    lines.push(`Total Expenses Disbursed,${overview.total_expenses_disbursed}`);
    lines.push(`Total Welfare Disbursed,${overview.total_welfare_disbursed}`);
    lines.push(`Net Available Treasury Balance,${overview.net_available_cash}`);
    lines.push(`Total Outstanding Obligations,${overview.total_outstanding_debt}`);
    lines.push('');

    // Faculty Breakdown
    lines.push('FACULTY COLLECTION BREAKDOWN');
    lines.push('Faculty Name,Faculty Code,Students,Expected (USD),Collected (USD),Collection Rate (%),Outstanding (USD)');
    overview.faculty_collection_breakdown.forEach((f) => {
      lines.push(
        `"${f.faculty_name}",${f.faculty_code},${f.total_students},${f.expected_amount},${f.collected_amount},${f.collection_rate}%,${f.outstanding_amount}`
      );
    });
    lines.push('');

    // Verified Payments Listing
    lines.push('VERIFIED PAYMENT TRANSACTIONS');
    lines.push('Receipt No,Transaction Reference,Student ID,Student Name,Faculty,Amount (USD),Payment Method,Date');
    const verifiedPayments = dbInstance.payments.filter((p) => p.status === 'VERIFIED');
    verifiedPayments.forEach((p) => {
      const student = dbInstance.students.find((s) => s.id === p.student_id);
      const faculty = student ? dbInstance.faculties.find((f) => f.id === student.faculty_id) : null;
      lines.push(
        `${p.receipt_number || 'N/A'},"${p.transaction_reference}","${student?.student_id_number || 'N/A'}","${student?.full_name || 'N/A'}","${faculty?.name || 'N/A'}",${p.amount},${p.payment_method},${p.payment_date}`
      );
    });

    return lines.join('\n');
  }
}
