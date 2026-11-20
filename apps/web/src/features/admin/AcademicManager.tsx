import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Faculty, Department, AcademicYear, Semester, ClassCohort } from '@keydso/shared-types';
import { Building2, Calendar, Plus, CheckCircle2, AlertCircle, Layers } from 'lucide-react';

export const AcademicManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'years' | 'faculties' | 'departments' | 'classes'>('faculties');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassCohort[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Faculty Modal Form state
  const [showFacModal, setShowFacModal] = useState(false);
  const [newFac, setNewFac] = useState({ code: '', name: '', description: '' });

  // New Academic Year Modal Form state
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYear, setNewYear] = useState({ code: '', name: '', start_date: '', end_date: '', is_current: false });

  // New Department Modal Form state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDept, setNewDept] = useState({ faculty_id: '', code: '', name: '' });

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [y, f, d, c] = await Promise.all([
        api.getAcademicYears(),
        api.getFaculties(),
        api.getDepartments(),
        api.getClasses(),
      ]);
      setYears(y);
      setFaculties(f);
      setDepartments(d);
      setClasses(c);
      if (y.length > 0) {
        const s = await api.getSemesters(y[0].id);
        setSemesters(s);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFaculty(newFac);
      setShowFacModal(false);
      setNewFac({ code: '', name: '', description: '' });
      setNotification({ type: 'success', message: 'Faculty created successfully' });
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAcademicYear(newYear);
      setShowYearModal(false);
      setNewYear({ code: '', name: '', start_date: '', end_date: '', is_current: false });
      setNotification({ type: 'success', message: 'Academic Year registered' });
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment(newDept);
      setShowDeptModal(false);
      setNewDept({ faculty_id: '', code: '', name: '' });
      setNotification({ type: 'success', message: 'Department created successfully' });
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-sky-600" />
            <span>Academic Structure Hierarchy</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional academic years, semesters, faculties, departments, and classes.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'faculties' && (
            <button
              onClick={() => setShowFacModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Faculty</span>
            </button>
          )}

          {activeTab === 'departments' && (
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}

          {activeTab === 'years' && (
            <button
              onClick={() => setShowYearModal(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Academic Year</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2.5 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('faculties')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'faculties' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Faculties ({faculties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'departments' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Departments ({departments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('years')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${
            activeTab === 'years' ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Academic Years & Semesters ({years.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'faculties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculties.map((fac) => (
            <div key={fac.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 bg-sky-50 text-sky-700 font-mono font-bold text-xs rounded border border-sky-200">
                  {fac.code}
                </span>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">Active</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-2.5">{fac.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{fac.description || 'No description provided'}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>{fac.department_count || 0} Departments</span>
                <span>{fac.student_count || 0} Students</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Dept Code</th>
                <th className="p-4">Department Name</th>
                <th className="p-4">Faculty</th>
                <th className="p-4 text-center">Enrolled Students</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-mono font-bold text-sky-700">{dept.code}</td>
                  <td className="p-4 font-medium text-slate-900">{dept.name}</td>
                  <td className="p-4 text-slate-600">{dept.faculty_name}</td>
                  <td className="p-4 text-center font-semibold text-slate-800">{dept.student_count || 0}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded font-medium">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'years' && (
        <div className="space-y-4">
          {years.map((y) => (
            <div key={y.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-700 mr-2">{y.code}</span>
                  <span className="font-bold text-slate-900 text-base">{y.name}</span>
                </div>
                {y.is_current && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full font-bold">
                    Current Active Year
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Duration: {y.start_date} to {y.end_date}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Semesters</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {semesters
                    .filter((s) => s.academic_year_id === y.id)
                    .map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{s.name} ({s.code})</div>
                          <div className="text-slate-500">{s.start_date} – {s.end_date}</div>
                        </div>
                        {s.is_current && (
                          <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[10px] rounded font-bold">
                            Active Semester
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Faculty */}
      {showFacModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add New Faculty</h3>
            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Faculty Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FHS, ENG, LAW"
                  value={newFac.code}
                  onChange={(e) => setNewFac({ ...newFac, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Faculty Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty of Health Sciences"
                  value={newFac.name}
                  onChange={(e) => setNewFac({ ...newFac, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  placeholder="Optional brief mandate"
                  value={newFac.description}
                  onChange={(e) => setNewFac({ ...newFac, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFacModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Department */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add Department</h3>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Parent Faculty</label>
                <select
                  required
                  value={newDept.faculty_id}
                  onChange={(e) => setNewDept({ ...newDept, faculty_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select faculty...</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NURS, PHARM"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department of Nursing"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
