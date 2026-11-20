import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { IssueReport, Faculty, RoleName } from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Check,
  ShieldCheck,
  ShieldAlert,
  Building,
  User,
  ArrowRight,
} from 'lucide-react';

export const FacultyChallengesPage: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isFacultyPres = roles.includes(RoleName.FACULTY_PRESIDENT);
  const isExecutive =
    roles.includes(RoleName.GENERAL_PRESIDENT) ||
    roles.includes(RoleName.VICE_PRESIDENT) ||
    roles.includes(RoleName.SYSTEM_ADMIN);

  const canResolve = isFacultyPres || isExecutive;

  const [issues, setIssues] = useState<IssueReport[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [resolvingIssue, setResolvingIssue] = useState<IssueReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Report Form
  const [reportForm, setReportForm] = useState({
    faculty_id: '',
    category: 'INFRASTRUCTURE' as any,
    priority: 'HIGH' as any,
    title: '',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [issuesRes, facRes] = await Promise.all([
        api.getIssues({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          priority: priorityFilter || undefined,
        }),
        api.getFaculties(),
      ]);
      setIssues(issuesRes);
      setFaculties(facRes);

      if (facRes.length > 0 && !reportForm.faculty_id) {
        setReportForm((prev) => ({
          ...prev,
          faculty_id: user?.assigned_faculty_id || facRes[0].id,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, priorityFilter]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await api.createIssue(reportForm);
      setSuccessMsg(`Challenge registered under ticket reference ${res.reference_number}`);
      setIsReportModalOpen(false);
      setReportForm({
        faculty_id: faculties[0]?.id || '',
        category: 'INFRASTRUCTURE',
        priority: 'HIGH',
        title: '',
        description: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to report challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (issueId: string, status: string) => {
    try {
      setError(null);
      await api.updateIssueStatus(issueId, { status });
      setSuccessMsg(`Issue status updated to ${status}`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update issue status');
    }
  };

  const handleResolveIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.resolveIssue(resolvingIssue.id, {
        resolution_notes: resolutionNotes.trim(),
      });
      setSuccessMsg(`Issue ${resolvingIssue.reference_number} resolved and closed.`);
      setResolvingIssue(null);
      setResolutionNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve issue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            Faculty Challenges & Student Issues Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track student grievances, lab malfunctions, facility bottlenecks, and representative resolutions.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Report Challenge
        </button>
      </div>

      {/* Cross-Faculty Isolation Security Notice */}
      <div className="p-4 bg-slate-900 text-white rounded-xl flex items-start gap-3 text-xs shadow-sm">
        <ShieldCheck className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-sm font-semibold text-sky-300 block">
            Scope & Cross-Faculty Isolation Boundary
          </strong>
          Security policy: Faculty Presidents are scoped strictly to their own assigned faculty and cannot inspect or resolve issues from other faculties.
          The General Council President and Secretariat maintain university-wide oversight across all faculties.
        </div>
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

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 text-sm">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="INFRASTRUCTURE">Infrastructure & Facilities</option>
          <option value="ACADEMIC">Academic & Exams</option>
          <option value="WELFARE">Student Welfare</option>
          <option value="ADMINISTRATIVE">Administrative</option>
          <option value="FINANCIAL">Financial / Fees</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 p-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No issues found</h3>
            <p className="text-sm text-slate-500 mt-1">
              There are currently no challenges registered under the active filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Priority & Category</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((issue) => {
                  const isResolved = issue.status === 'RESOLVED';
                  const isInProgress = issue.status === 'IN_PROGRESS';
                  const isSubmitted = issue.status === 'SUBMITTED';

                  return (
                    <tr key={issue.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700 whitespace-nowrap">
                        {issue.reference_number}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              issue.priority === 'CRITICAL'
                                ? 'bg-rose-600 text-white'
                                : issue.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : issue.priority === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {issue.priority}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">
                            {issue.category}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-xs font-semibold text-slate-800 whitespace-nowrap">
                        {issue.faculty_name || 'General'}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <div className="font-bold text-slate-900 text-sm">{issue.title}</div>
                        <p className="text-xs text-slate-600 line-clamp-1">{issue.description}</p>
                        {issue.resolution_notes && (
                          <div className="text-[11px] text-emerald-700 font-medium mt-1 bg-emerald-50 p-1.5 rounded">
                            Resolution: {issue.resolution_notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {issue.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canResolve && !isResolved && (
                          <div className="flex items-center justify-end gap-2">
                            {isSubmitted && (
                              <button
                                onClick={() => handleUpdateStatus(issue.id, 'IN_PROGRESS')}
                                className="px-2.5 py-1 text-sky-700 hover:bg-sky-50 border border-sky-200 rounded text-xs font-semibold transition"
                              >
                                Take Case
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setResolvingIssue(issue);
                                setResolutionNotes('');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Resolve
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Report Faculty Challenge</h2>
            <p className="text-xs text-slate-500 mb-4">
              Submit an issue or grievance to your designated faculty representative council.
            </p>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Faculty *</label>
                <select
                  value={reportForm.faculty_id}
                  onChange={(e) => setReportForm({ ...reportForm, faculty_id: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {faculties.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value as any })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="INFRASTRUCTURE">Infrastructure & Facilities</option>
                    <option value="ACADEMIC">Academic & Exams</option>
                    <option value="WELFARE">Student Welfare</option>
                    <option value="ADMINISTRATIVE">Administrative</option>
                    <option value="FINANCIAL">Financial / Fees</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Priority *</label>
                  <select
                    value={reportForm.priority}
                    onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value as any })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="CRITICAL">Critical (Immediate)</option>
                    <option value="HIGH">High (Urgent)</option>
                    <option value="MEDIUM">Medium (Normal)</option>
                    <option value="LOW">Low (Routine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title * (min 3 chars)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab B WiFi router failing during practical sessions"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description * (min 10 chars)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the exact location, timing, impact on students, and recommended council action..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Register Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Resolve Challenge {resolvingIssue.reference_number}
            </h2>
            <p className="text-xs text-slate-500 mb-4">{resolvingIssue.title}</p>

            <form onSubmit={handleResolveIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Resolution Notes * (min 5 chars)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain how the issue was resolved (e.g. Dean contacted, equipment replaced, exam moved)..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingIssue(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || resolutionNotes.trim().length < 5}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
