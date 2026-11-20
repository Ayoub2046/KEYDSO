import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Committee,
  CommitteeTask,
  RoleName,
  AcademicYear,
  UserProfile,
} from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import {
  Briefcase,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  CheckSquare,
  UserPlus,
  Trash2,
  Building,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const CommitteesManager: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canManage = roles.includes(RoleName.GENERAL_PRESIDENT) || roles.includes(RoleName.SYSTEM_ADMIN);

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    mandate: '',
    academic_year_id: '',
  });

  const [memberForm, setMemberForm] = useState({
    user_id: '',
    role_in_committee: 'MEMBER',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [commRes, ayRes] = await Promise.all([
        api.getCommittees(),
        api.getAcademicYears(),
      ]);
      setCommittees(commRes);
      setAcademicYears(ayRes);

      if (ayRes.length > 0 && !createForm.academic_year_id) {
        setCreateForm((prev) => ({
          ...prev,
          academic_year_id: ayRes.find((a) => a.is_current)?.id || ayRes[0].id,
        }));
      }

      // Load users list for member assignment if managing
      if (canManage) {
        const usersRes = await api.getUsers();
        setUsers(usersRes);
        if (usersRes.length > 0) {
          setMemberForm((prev) => ({ ...prev, user_id: usersRes[0].id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load committees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCommittee = async (id: string) => {
    try {
      const details = await api.getCommitteeById(id);
      setSelectedCommittee(details);
    } catch (err: any) {
      setError(err.message || 'Failed to load committee details');
    }
  };

  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createCommittee(createForm);
      setSuccessMsg(`Committee "${createForm.name}" created successfully`);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        code: '',
        mandate: '',
        academic_year_id: academicYears[0]?.id || '',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create committee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommittee) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.assignCommitteeMember(selectedCommittee.id, memberForm);
      setSuccessMsg('Committee member assigned successfully');
      setIsMemberModalOpen(false);
      handleSelectCommittee(selectedCommittee.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to add committee member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedCommittee) return;
    if (!confirm('Are you sure you want to remove this member from the committee?')) return;

    try {
      setError(null);
      await api.removeCommitteeMember(selectedCommittee.id, userId);
      setSuccessMsg('Member removed from committee');
      handleSelectCommittee(selectedCommittee.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommittee) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.createCommitteeTask({
        committee_id: selectedCommittee.id,
        title: taskForm.title,
        description: taskForm.description || undefined,
        assigned_to: taskForm.assigned_to || undefined,
        due_date: taskForm.due_date || undefined,
      });
      setSuccessMsg('Task assigned to committee');
      setIsTaskModalOpen(false);
      setTaskForm({
        title: '',
        description: '',
        assigned_to: '',
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
      handleSelectCommittee(selectedCommittee.id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to assign committee task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      setError(null);
      await api.updateCommitteeTaskStatus(taskId, status);
      if (selectedCommittee) {
        handleSelectCommittee(selectedCommittee.id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-sky-600" />
            Council Committees & Workgroups
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Student council committees, mandates, member assignments, and action-item task tracking.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Committee
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left = Committees List, Right = Selected Committee Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Committees List */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Committees Roster ({committees.length})
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {committees.map((comm) => (
                <div
                  key={comm.id}
                  onClick={() => handleSelectCommittee(comm.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedCommittee?.id === comm.id
                      ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span className="font-mono font-bold uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                      {comm.code}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <Users className="w-3.5 h-3.5" /> {comm.member_count || 0} members
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-1">{comm.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{comm.mandate}</p>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Chair: <strong className="text-slate-700">{comm.chairperson_name || 'Unassigned'}</strong>
                    </span>
                    <span className="text-sky-600 font-semibold">{comm.task_count || 0} tasks</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Committee Details & Task Board */}
        <div className="lg:col-span-2">
          {!selectedCommittee ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a committee to inspect membership and task board</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Committee Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {selectedCommittee.code}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedCommittee.name}</h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-xl">{selectedCommittee.mandate}</p>
                </div>

                {canManage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsMemberModalOpen(true)}
                      className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-sky-200 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Add Member
                    </button>
                    <button
                      onClick={() => setIsTaskModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Assign Task
                    </button>
                  </div>
                )}
              </div>

              {/* Members Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  Assigned Committee Members ({selectedCommittee.members?.length || 0})
                </h3>

                {selectedCommittee.members && selectedCommittee.members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCommittee.members.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{member.user_name || 'Member'}</div>
                          <div className="text-slate-500 text-[11px] font-mono">{member.user_email}</div>
                          <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px]">
                            {member.role_in_committee}
                          </span>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                    No members assigned to this committee yet.
                  </div>
                )}
              </div>

              {/* Tasks Board Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  Action Items & Task Deliverables ({selectedCommittee.tasks?.length || 0})
                </h3>

                {selectedCommittee.tasks && selectedCommittee.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCommittee.tasks.map((task) => {
                      const isCompleted = task.status === 'COMPLETED';
                      const isInProgress = task.status === 'IN_PROGRESS';

                      return (
                        <div
                          key={task.id}
                          className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{task.title}</div>
                            {task.description && (
                              <p className="text-slate-600 mt-0.5 text-xs">{task.description}</p>
                            )}
                            <div className="flex gap-3 text-slate-400 text-[11px] mt-1">
                              {task.due_date && <span>Due: {task.due_date}</span>}
                              {task.assigned_to_name && <span>Assignee: {task.assigned_to_name}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isInProgress
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {task.status}
                            </span>

                            {!isCompleted && (
                              <button
                                onClick={() =>
                                  handleUpdateTaskStatus(
                                    task.id,
                                    isInProgress ? 'COMPLETED' : 'IN_PROGRESS'
                                  )
                                }
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition"
                              >
                                {isInProgress ? 'Mark Completed' : 'Start Task'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                    No active deliverables assigned to this committee.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Committee Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Council Committee</h2>
            <p className="text-xs text-slate-500 mb-4">
              Establish a new specialized student council committee with clear mandate and authority.
            </p>

            <form onSubmit={handleCreateCommittee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Committee Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health & Safety Inspection Committee"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code / Abbreviation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HEALTH-COMM"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  className="w-full text-sm font-mono uppercase border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mandate & Responsibilities * (min 10 chars)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the scope, jurisdiction, and regular duties of this committee..."
                  value={createForm.mandate}
                  onChange={(e) => setCreateForm({ ...createForm, mandate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
                <select
                  value={createForm.academic_year_id}
                  onChange={(e) => setCreateForm({ ...createForm, academic_year_id: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Committee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Member Modal */}
      {isMemberModalOpen && selectedCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Add Member to {selectedCommittee.name}</h2>
            <p className="text-xs text-slate-500 mb-4">Designate user profile and their title in the committee.</p>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select User *</label>
                <select
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title in Committee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vice-Chairperson, Secretary, Coordinator"
                  value={memberForm.role_in_committee}
                  onChange={(e) => setMemberForm({ ...memberForm, role_in_committee: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isTaskModalOpen && selectedCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Assign Task to {selectedCommittee.name}</h2>
            <p className="text-xs text-slate-500 mb-4">Set action item deliverable and completion deadline.</p>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct campus cafeteria price audit"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Detailed specifications for this deliverable..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
