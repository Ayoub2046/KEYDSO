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
} from '@keydso/shared-types';

const API_BASE = '/api/v1';

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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload: ApiResponse<T> = await response.json();

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
  getMe: () => request<UserProfile & { roles: RoleName[]; assigned_faculty_id?: string }>('/auth/me'),

  // Student Portal
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
};
