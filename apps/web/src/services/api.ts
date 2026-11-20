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
};
