import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Student, Faculty, Department } from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import { RoleName } from '@keydso/shared-types';
import {
  Search,
  Filter,
  GraduationCap,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StudentDirectory: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes(RoleName.SYSTEM_ADMIN);
  const isFacPres = user?.roles?.includes(RoleName.FACULTY_PRESIDENT) && !isAdmin;

  const [students, setStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(user?.assigned_faculty_id || '');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Single Student Registration Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_id_number: '',
    full_name: '',
    faculty_id: '',
    department_id: '',
    class_id: '',
    academic_year_id: '',
    contact_number: '',
    email: '',
  });

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStudents({
        faculty_id: selectedFaculty || undefined,
        department_id: selectedDepartment || undefined,
        search: searchQuery || undefined,
        page,
        page_size: 15,
      });
      setStudents(res.items);
      setTotalPages(res.total_pages);
      setTotalRecords(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.getFaculties(), api.getDepartments()]).then(([f, d]) => {
      setFaculties(f);
      setDepartments(d);
    });
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedFaculty, selectedDepartment, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-sky-600" />
            <span>Student Directory</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Institutional directory of enrolled students and representative affiliations.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/admin/import')}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-600" />
              <span>Bulk CSV Import</span>
            </button>
          </div>
        )}
      </div>

      {isFacPres && (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-lg flex items-center gap-2.5 text-xs text-sky-800 font-medium">
          <ShieldAlert className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span>
            Faculty President View: You are currently viewing students strictly enrolled in your designated faculty scope. Cross-faculty browsing is restricted by security policy.
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student ID or full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {!isFacPres && (
            <select
              value={selectedFaculty}
              onChange={(e) => {
                setSelectedFaculty(e.target.value);
                setSelectedDepartment('');
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none"
            >
              <option value="">All Faculties</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          )}

          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments
              .filter((d) => !selectedFaculty || d.faculty_id === selectedFaculty)
              .map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading student directory...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No students found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Faculty</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-sky-700">{stu.student_id_number}</td>
                    <td className="p-4 font-medium text-slate-900">{stu.full_name}</td>
                    <td className="p-4 text-slate-600">{stu.faculty_name || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{stu.department_name || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{stu.class_name || 'N/A'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
                        {stu.enrollment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{students.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
