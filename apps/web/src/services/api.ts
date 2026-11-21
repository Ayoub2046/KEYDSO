import {
  ApiResponse,
  PaginatedResponse,
  Student,
  Faculty,
  Department,
  ClassCohort,
  AcademicYear,
  Semester,
  UserProfile,
  RoleName,
  StudentPortalOverview,
  RepresentativeInfo,
  StudentReceipt,
  PublicExpenseSummary,
  Announcement,
  ContributionCampaign,
  Fund,
  Payment,
  Expense,
  LedgerEntry,
  WelfareCase,
  Committee,
  CommitteeMembership,
  CommitteeTask,
  MeetingAndTraining,
  IssueReport,
  CouncilDashboardOverview,
  FinancialAnalyticsOverview,
  FacultyPerformanceReport,
  CommitteeGovernanceAnalytics,
  AuditExportReport,
  InAppNotification,
  NotificationCenterOverview,
  LandingPageSettings,
} from '@keydso/shared-types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('keydso_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new Error('Cannot connect to server. Please ensure the API is running on port 4000.');
  }

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? 'Server returned an unexpected empty response.'
        : `Server error ${response.status}: ${response.statusText}`
    );
  }

  if (!response.ok || !payload.success) {
    const errorMsg = (payload as any).error?.message || payload.message || 'API request failed';
    throw new Error(errorMsg);
  }

  return payload.data;
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    request<{ updated: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<UserProfile & { roles: RoleName[]; assigned_faculty_id?: string }>('/auth/me'),

  // Student Portal
  getLandingSettings: () => request<LandingPageSettings>('/portal/landing-settings'),
  updateLandingSettings: async (data: LandingPageSettings) => {
    try {
      return await request<LandingPageSettings>('/portal/landing-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      return await request<LandingPageSettings>('/admin/landing-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  },
  getPortalOverview: () => request<StudentPortalOverview>('/portal/overview'),
  getRepresentatives: (facultyId?: string) =>
    request<RepresentativeInfo[]>(facultyId ? `/portal/representatives?faculty_id=${facultyId}` : '/portal/representatives'),
  getReceipt: (receiptNumber: string) => request<StudentReceipt>(`/portal/receipts/${receiptNumber}`),
  submitFeedback: (data: any) => request<any>('/portal/feedback', { method: 'POST', body: JSON.stringify(data) }),
  getTransparencyFeed: () => request<PublicExpenseSummary[]>('/portal/transparency'),
  getAnnouncements: () => request<Announcement[]>('/portal/announcements'),

  // Academic
  getAcademicYears: () => request<AcademicYear[]>('/academic/academic-years'),
  createAcademicYear: (data: any) => request<AcademicYear>('/academic/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  getSemesters: (academicYearId?: string) =>
    request<Semester[]>(academicYearId ? `/academic/semesters?academic_year_id=${academicYearId}` : '/academic/semesters'),
  createSemester: (data: any) => request<Semester>('/academic/semesters', { method: 'POST', body: JSON.stringify(data) }),
  getFaculties: () => request<Faculty[]>('/academic/faculties'),
  createFaculty: (data: any) => request<Faculty>('/academic/faculties', { method: 'POST', body: JSON.stringify(data) }),
  getDepartments: (facultyId?: string) =>
    request<Department[]>(facultyId ? `/academic/departments?faculty_id=${facultyId}` : '/academic/departments'),
  createDepartment: (data: any) => request<Department>('/academic/departments', { method: 'POST', body: JSON.stringify(data) }),
  getClasses: (departmentId?: string) =>
    request<ClassCohort[]>(departmentId ? `/academic/classes?department_id=${departmentId}` : '/academic/classes'),
  createClass: (data: any) => request<ClassCohort>('/academic/classes', { method: 'POST', body: JSON.stringify(data) }),

  // Students Directory & Bulk Import
  getStudents: (params: { faculty_id?: string; department_id?: string; search?: string; page?: number; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params.faculty_id) query.append('faculty_id', params.faculty_id);
    if (params.department_id) query.append('department_id', params.department_id);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    return request<PaginatedResponse<Student>>(`/students?${query.toString()}`);
  },
  registerStudent: (data: any) => request<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  bulkImportStudents: (data: { academic_year_id: string; records: any[]; dry_run: boolean }) =>
    request<any>('/students/import', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getUsers: () => request<any[]>('/admin/users'),
  createUser: (data: any) => request<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  assignFacultyRep: (data: any) => request<any>('/admin/assign-faculty-rep', { method: 'POST', body: JSON.stringify(data) }),
  getAuditLogs: (page = 1) => request<PaginatedResponse<any>>(`/admin/audit-logs?page=${page}`),

  // Finance
  getCampaigns: (academicYearId?: string) =>
    request<ContributionCampaign[]>(academicYearId ? `/finance/campaigns?academic_year_id=${academicYearId}` : '/finance/campaigns'),
  createCampaign: (data: any) =>
    request<ContributionCampaign>('/finance/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  approveCampaign: (id: string) =>
    request<{ campaign: ContributionCampaign; generated_obligations: number }>(`/finance/campaigns/${id}/approve`, { method: 'POST' }),

  getPayments: (params?: { campaign_id?: string; student_id?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.campaign_id) query.append('campaign_id', params.campaign_id);
    if (params?.student_id) query.append('student_id', params.student_id);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return request<Payment[]>(qs ? `/finance/payments?${qs}` : '/finance/payments');
  },
  recordPayment: (data: any) =>
    request<Payment>('/finance/payments', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (id: string, data: { verification_note?: string } = {}) =>
    request<{ payment: Payment; receipt: any; ledgerEntry: any }>(`/finance/payments/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reversePayment: (id: string, data: { reversal_reason: string }) =>
    request<{ payment: Payment; ledgerEntry: any }>(`/finance/payments/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExpenses: (fundId?: string) =>
    request<Expense[]>(fundId ? `/finance/expenses?fund_id=${fundId}` : '/finance/expenses'),
  createExpenseRequest: (data: any) =>
    request<Expense>('/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
  approveExpense: (id: string, data: { approved_amount?: number; remarks?: string } = {}) =>
    request<Expense>(`/finance/expenses/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  disburseExpense: (id: string) =>
    request<{ expense: Expense; ledgerEntry: any }>(`/finance/expenses/${id}/disburse`, { method: 'POST' }),
  reconcileExpense: (id: string, data: { evidence_files: any[]; final_amount?: number; invoice_number?: string }) =>
    request<Expense>(`/finance/expenses/${id}/reconcile`, { method: 'POST', body: JSON.stringify(data) }),

  getLedger: (params?: { fund_id?: string; page?: number; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params?.fund_id) query.append('fund_id', params.fund_id);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.page_size) query.append('page_size', params.page_size.toString());
    const qs = query.toString();
    return request<PaginatedResponse<LedgerEntry>>(qs ? `/finance/ledger?${qs}` : '/finance/ledger');
  },
  getFunds: () => request<Fund[]>('/finance/funds'),

  getWelfareCases: () => request<WelfareCase[]>('/finance/welfare'),
  createWelfareCase: (data: { student_id: string; confidential_reason: string; requested_amount: number }) =>
    request<WelfareCase>('/finance/welfare', { method: 'POST', body: JSON.stringify(data) }),

  // Governance: Committees
  getCommittees: (academicYearId?: string, facultyId?: string) => {
    const query = new URLSearchParams();
    if (academicYearId) query.append('academic_year_id', academicYearId);
    if (facultyId) query.append('faculty_id', facultyId);
    const qs = query.toString();
    return request<Committee[]>(qs ? `/governance/committees?${qs}` : '/governance/committees');
  },
  getCommitteeById: (id: string) => request<Committee>(`/governance/committees/${id}`),
  createCommittee: (data: any) =>
    request<Committee>('/governance/committees', { method: 'POST', body: JSON.stringify(data) }),
  assignCommitteeMember: (committeeId: string, data: { user_id: string; role_in_committee?: string }) =>
    request<CommitteeMembership>(`/governance/committees/${committeeId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeCommitteeMember: (committeeId: string, userId: string) =>
    request<{ removed: boolean }>(`/governance/committees/${committeeId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Governance: Tasks
  getCommitteeTasks: (params?: { committee_id?: string; assigned_to?: string }) => {
    const query = new URLSearchParams();
    if (params?.committee_id) query.append('committee_id', params.committee_id);
    if (params?.assigned_to) query.append('assigned_to', params.assigned_to);
    const qs = query.toString();
    return request<CommitteeTask[]>(qs ? `/governance/tasks?${qs}` : '/governance/tasks');
  },
  createCommitteeTask: (data: any) =>
    request<CommitteeTask>('/governance/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateCommitteeTaskStatus: (taskId: string, status: string) =>
    request<CommitteeTask>(`/governance/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Governance: Meetings & Training
  getMeetings: (params?: { academic_year_id?: string; faculty_id?: string; committee_id?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.academic_year_id) query.append('academic_year_id', params.academic_year_id);
    if (params?.faculty_id) query.append('faculty_id', params.faculty_id);
    if (params?.committee_id) query.append('committee_id', params.committee_id);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return request<MeetingAndTraining[]>(qs ? `/governance/meetings?${qs}` : '/governance/meetings');
  },
  createMeeting: (data: any) =>
    request<MeetingAndTraining>('/governance/meetings', { method: 'POST', body: JSON.stringify(data) }),
  reviewMeeting: (id: string, data: { status: 'APPROVED' | 'REJECTED'; rejection_reason?: string }) =>
    request<MeetingAndTraining>(`/governance/meetings/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordMeetingMinutes: (id: string, data: { minutes: string; official_resolutions?: string; attendance_count: number }) =>
    request<MeetingAndTraining>(`/governance/meetings/${id}/minutes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Governance: Challenges & Issues
  getIssues: (params?: { faculty_id?: string; status?: string; category?: string; priority?: string }) => {
    const query = new URLSearchParams();
    if (params?.faculty_id) query.append('faculty_id', params.faculty_id);
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.priority) query.append('priority', params.priority);
    const qs = query.toString();
    return request<IssueReport[]>(qs ? `/governance/issues?${qs}` : '/governance/issues');
  },
  createIssue: (data: any) =>
    request<IssueReport>('/governance/issues', { method: 'POST', body: JSON.stringify(data) }),
  updateIssueStatus: (id: string, data: { status: string; assigned_to?: string }) =>
    request<IssueReport>(`/governance/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  resolveIssue: (id: string, data: { resolution_notes: string }) =>
    request<IssueReport>(`/governance/issues/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Governance: Dashboard Overview
  getCouncilDashboard: () => request<CouncilDashboardOverview>('/governance/dashboard'),

  // Reports & Analytics
  getFinancialOverview: (params?: { faculty_id?: string; start_date?: string; end_date?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => !!v) as any).toString() : '';
    return request<FinancialAnalyticsOverview>(`/reports/financial-overview${qs}`);
  },
  getFacultyPerformance: (params?: { faculty_id?: string }) => {
    const qs = params?.faculty_id ? `?faculty_id=${params.faculty_id}` : '';
    return request<FacultyPerformanceReport[]>(`/reports/faculty-performance${qs}`);
  },
  getGovernanceAnalytics: () => request<CommitteeGovernanceAnalytics>('/reports/governance-analytics'),
  getAuditExport: (reportType?: string) => {
    const qs = reportType ? `?report_type=${reportType}` : '';
    return request<AuditExportReport>(`/reports/audit-export${qs}`);
  },
  downloadFinancialCsv: async () => {
    const token = localStorage.getItem('keydso_token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('/api/v1/reports/export/financial-csv', { headers });
    if (!res.ok) throw new Error('CSV download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keydso_financial_audit_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Notification Center
  getNotifications: () => request<NotificationCenterOverview>('/notifications'),
  markNotificationRead: (id: string) => request<InAppNotification>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request<{ marked_count: number }>('/notifications/mark-all-read', { method: 'POST' }),
  registerPushSubscription: (data: any) =>
    request<{ success: boolean; subscription_id: string }>('/notifications/push-subscription', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unregisterPushSubscription: (endpoint: string) =>
    request<{ success: boolean }>('/notifications/push-subscription', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),
};
