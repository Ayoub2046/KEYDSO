import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Student, Faculty, Department } from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import { RoleName } from '@keydso/shared-types';
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
    <div className="container-fluid py-2">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 pb-3 mb-4 border-bottom">
        <div>
          <h3 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-mortarboard-fill text-primary"></i>
            <span>Student Directory</span>
          </h3>
          <p className="text-muted small mb-0">
            Institutional directory of enrolled students and academic council affiliations.
          </p>
        </div>

        {isAdmin && (
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => navigate('/admin/import')}
              className="btn btn-outline-primary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
            >
              <i className="bi bi-file-earmark-spreadsheet"></i>
              <span>Bulk CSV Import</span>
            </button>
          </div>
        )}
      </div>

      {isFacPres && (
        <div className="alert alert-info d-flex align-items-center gap-2 rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-shield-lock-fill fs-5 text-info flex-shrink-0"></i>
          <div className="small">
            <strong>Faculty President Scope:</strong> You are currently viewing students strictly enrolled in your designated faculty scope. Cross-faculty browsing is restricted by security policy.
          </div>
        </div>
      )}

      {/* Filter and Search Bar Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-md-5">
              <form onSubmit={handleSearch}>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by student ID or full name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control bg-light border-start-0 ps-0"
                  />
                  <button type="submit" className="btn btn-primary px-3">
                    Search
                  </button>
                </div>
              </form>
            </div>

            <div className="col-12 col-md-7">
              <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                {!isFacPres && (
                  <select
                    value={selectedFaculty}
                    onChange={(e) => {
                      setSelectedFaculty(e.target.value);
                      setSelectedDepartment('');
                      setPage(1);
                    }}
                    className="form-select form-select-sm w-auto bg-light"
                  >
                    <option value="">All Faculties</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setPage(1);
                  }}
                  className="form-select form-select-sm w-auto bg-light"
                >
                  <option value="">All Departments</option>
                  {departments
                    .filter((d) => !selectedFaculty || d.faculty_id === selectedFaculty)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>

                {(selectedFaculty || selectedDepartment || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedFaculty('');
                      setSelectedDepartment('');
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Table Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="text-muted small mt-2">Loading student directory...</div>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people fs-1 text-secondary opacity-50 mb-2 d-block"></i>
            <div>No students found matching the selected filters.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-4">Student ID</th>
                  <th scope="col">Full Name</th>
                  <th scope="col">Faculty</th>
                  <th scope="col">Department</th>
                  <th scope="col">Class</th>
                  <th scope="col" className="pe-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu) => (
                  <tr key={stu.id}>
                    <td className="ps-4 font-monospace fw-bold text-primary">
                      {stu.student_id_number}
                    </td>
                    <td className="fw-medium text-dark">{stu.full_name}</td>
                    <td className="text-secondary small">{stu.faculty_name || '—'}</td>
                    <td className="text-secondary small">{stu.department_name || '—'}</td>
                    <td className="text-secondary small">{stu.class_name || '—'}</td>
                    <td className="pe-4 text-center">
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1">
                        {stu.enrollment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Card Footer with Pagination */}
        <div className="card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
          <div className="small text-muted">
            Showing <strong className="text-dark">{students.length}</strong> of{' '}
            <strong className="text-dark">{totalRecords}</strong> enrolled students
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
            >
              <i className="bi bi-chevron-left me-1"></i> Prev
            </button>
            <span className="small fw-semibold text-secondary px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
            >
              Next <i className="bi bi-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
