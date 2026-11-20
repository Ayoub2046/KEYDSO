import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Faculty, AcademicYear, RoleName } from '@keydso/shared-types';
import { Shield, UserPlus, CheckCircle2, AlertCircle, Award } from 'lucide-react';

export const UserRoleManager: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal: Create User
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: RoleName.STUDENT,
  });

  // Modal: Assign Faculty Representative
  const [showAssignRepModal, setShowAssignRepModal] = useState(false);
  const [repAssignment, setRepAssignment] = useState({
    user_id: '',
    faculty_id: '',
    academic_year_id: '',
    role_title: 'Faculty President',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [u, f, ay] = await Promise.all([api.getUsers(), api.getFaculties(), api.getAcademicYears()]);
      setUsers(u);
      setFaculties(f);
      setAcademicYears(ay);
      if (ay.length > 0 && !repAssignment.academic_year_id) {
        setRepAssignment((prev) => ({ ...prev, academic_year_id: ay[0].id }));
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        email: newUser.email,
        full_name: newUser.full_name,
        password: newUser.password,
        roles: [newUser.role],
      });
      setShowCreateUserModal(false);
      setNewUser({ email: '', full_name: '', password: '', role: RoleName.STUDENT });
      setNotification({ type: 'success', message: 'User account provisioned successfully' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleAssignRep = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.assignFacultyRep(repAssignment);
      setShowAssignRepModal(false);
      setNotification({ type: 'success', message: 'Faculty representative designated successfully' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-sky-600" />
            <span>Users, Roles & Representative Governance</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Assign council privileges, enforce separation of duties, and designate faculty representatives.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAssignRepModal(true)}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Designate Faculty Rep</span>
          </button>

          <button
            onClick={() => setShowCreateUserModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision User</span>
          </button>
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

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Assigned Roles</th>
              <th className="p-4">Faculty Jurisdiction Scope</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="p-4">
                  <div className="font-semibold text-slate-900">{u.full_name}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {u.roles?.map((r: string) => (
                      <span
                        key={r}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                          r === 'SYSTEM_ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : r === 'FACULTY_PRESIDENT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : r === 'FINANCE_OFFICER'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-slate-600">
                  {u.assigned_faculty_name ? (
                    <span className="font-medium text-slate-800">{u.assigned_faculty_name}</span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">None (Global or Student)</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Create User */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Provision New User Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fatima Omar Warsame"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. fatima@keydso.university.edu"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Primary Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as RoleName })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value={RoleName.STUDENT}>Student</option>
                  <option value={RoleName.FACULTY_PRESIDENT}>Faculty President</option>
                  <option value={RoleName.FINANCE_OFFICER}>Finance Officer</option>
                  <option value={RoleName.SECRETARY}>Council Secretary</option>
                  <option value={RoleName.GENERAL_PRESIDENT}>General Council President</option>
                  <option value={RoleName.VICE_PRESIDENT}>Vice President</option>
                  <option value={RoleName.SYSTEM_ADMIN}>System Administrator</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Faculty Representative */}
      {showAssignRepModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Designate Faculty Representative</h3>
            <form onSubmit={handleAssignRep} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select User</label>
                <select
                  required
                  value={repAssignment.user_id}
                  onChange={(e) => setRepAssignment({ ...repAssignment, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select candidate user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Faculty</label>
                <select
                  required
                  value={repAssignment.faculty_id}
                  onChange={(e) => setRepAssignment({ ...repAssignment, faculty_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">Select faculty to represent...</option>
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Academic Year</label>
                <select
                  required
                  value={repAssignment.academic_year_id}
                  onChange={(e) => setRepAssignment({ ...repAssignment, academic_year_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>{ay.name} ({ay.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignRepModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold"
                >
                  Confirm Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
