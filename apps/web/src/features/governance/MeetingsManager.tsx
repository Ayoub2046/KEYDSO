import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  MeetingAndTraining,
  AcademicYear,
  Faculty,
  Committee,
  RoleName,
  MeetingType,
} from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import {
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Users,
  Check,
  X,
  Building,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

export const MeetingsManager: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const isPresident = roles.includes(RoleName.GENERAL_PRESIDENT) || roles.includes(RoleName.SYSTEM_ADMIN);
  const isSecretary =
    roles.includes(RoleName.SECRETARY) ||
    roles.includes(RoleName.GENERAL_PRESIDENT) ||
    roles.includes(RoleName.SYSTEM_ADMIN);

  const canRequest =
    roles.includes(RoleName.FACULTY_PRESIDENT) ||
    roles.includes(RoleName.GENERAL_PRESIDENT) ||
    roles.includes(RoleName.VICE_PRESIDENT) ||
    roles.includes(RoleName.COMMITTEE_CHAIR) ||
    roles.includes(RoleName.SECRETARY) ||
    roles.includes(RoleName.SYSTEM_ADMIN);

  const [meetings, setMeetings] = useState<MeetingAndTraining[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reviewingMeeting, setReviewingMeeting] = useState<MeetingAndTraining | null>(null);
  const [recordingMeeting, setRecordingMeeting] = useState<MeetingAndTraining | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [requestForm, setRequestForm] = useState({
    title: '',
    type: 'FACULTY_MEETING' as MeetingType,
    faculty_id: '',
    committee_id: '',
    academic_year_id: '',
    scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    start_time: '14:00',
    end_time: '16:00',
    venue: '',
    agenda: '',
    target_audience: 'FACULTY',
  });

  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [rejectionReason, setRejectionReason] = useState('');

  const [minutesForm, setMinutesForm] = useState({
    minutes: '',
    official_resolutions: '',
    attendance_count: 10,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [meetingsRes, ayRes, facRes, commRes] = await Promise.all([
        api.getMeetings({ status: statusFilter || undefined }),
        api.getAcademicYears(),
        api.getFaculties(),
        api.getCommittees(),
      ]);
      setMeetings(meetingsRes);
      setAcademicYears(ayRes);
      setFaculties(facRes);
      setCommittees(commRes);

      if (ayRes.length > 0 && !requestForm.academic_year_id) {
        setRequestForm((prev) => ({
          ...prev,
          academic_year_id: ayRes.find((a) => a.is_current)?.id || ayRes[0].id,
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createMeeting({
        ...requestForm,
        faculty_id: requestForm.faculty_id || undefined,
        committee_id: requestForm.committee_id || undefined,
      });
      setSuccessMsg(`Meeting proposal "${requestForm.title}" submitted for presidential approval`);
      setIsRequestModalOpen(false);
      setRequestForm({
        title: '',
        type: 'FACULTY_MEETING',
        faculty_id: '',
        committee_id: '',
        academic_year_id: academicYears[0]?.id || '',
        scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '16:00',
        venue: '',
        agenda: '',
        target_audience: 'FACULTY',
      });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to request meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingMeeting) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.reviewMeeting(reviewingMeeting.id, {
        status: reviewAction,
        rejection_reason: reviewAction === 'REJECTED' ? rejectionReason : undefined,
      });
      setSuccessMsg(`Meeting request marked as ${reviewAction}`);
      setReviewingMeeting(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to review meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingMeeting) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.recordMeetingMinutes(recordingMeeting.id, {
        minutes: minutesForm.minutes,
        official_resolutions: minutesForm.official_resolutions || undefined,
        attendance_count: Number(minutesForm.attendance_count),
      });
      setSuccessMsg('Official minutes and council resolutions recorded. Meeting finalized.');
      setRecordingMeeting(null);
      setMinutesForm({ minutes: '', official_resolutions: '', attendance_count: 10 });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to record minutes');
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
            <Calendar className="w-7 h-7 text-sky-600" />
            Council Meetings & Training Assemblies
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official calendar of student assemblies, faculty consultations, and training workshops with certified minutes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="REQUESTED">Pending Request</option>
            <option value="APPROVED">Approved & Scheduled</option>
            <option value="COMPLETED">Completed with Minutes</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {canRequest && (
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Propose Meeting
            </button>
          )}
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

      {/* Meetings List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No meetings found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {canRequest ? 'Propose a council assembly or faculty training workshop to begin.' : 'No scheduled sessions available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {meetings.map((meeting) => {
            const isApproved = meeting.status === 'APPROVED';
            const isRequested = meeting.status === 'REQUESTED';
            const isCompleted = meeting.status === 'COMPLETED';
            const isRejected = meeting.status === 'REJECTED';

            return (
              <div
                key={meeting.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isApproved
                          ? 'bg-sky-100 text-sky-800'
                          : isRequested
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {meeting.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded">
                      {meeting.type.replace('_', ' ')}
                    </span>
                    {meeting.faculty_name && (
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 font-medium rounded flex items-center gap-1">
                        <Building className="w-3 h-3" /> {meeting.faculty_name}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{meeting.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{meeting.agenda}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {meeting.scheduled_date} • {meeting.start_time} - {meeting.end_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {meeting.venue}
                    </span>
                    {meeting.attendance_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {meeting.attendance_count} Attendees
                      </span>
                    )}
                  </div>

                  {/* Certified Minutes Preview */}
                  {meeting.minutes && (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1 mt-2">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-sky-600" />
                        Official Minutes & Decisions
                      </div>
                      <p className="text-slate-600">{meeting.minutes}</p>
                      {meeting.official_resolutions && (
                        <div className="text-[11px] text-emerald-800 font-medium pt-1">
                          Resolutions: {meeting.official_resolutions}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                  {isRequested && isPresident && (
                    <button
                      onClick={() => setReviewingMeeting(meeting)}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Review & Approve
                    </button>
                  )}

                  {isApproved && isSecretary && (
                    <button
                      onClick={() => {
                        setRecordingMeeting(meeting);
                        setMinutesForm({ minutes: '', official_resolutions: '', attendance_count: 10 });
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Record Minutes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Propose Meeting Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Propose Meeting or Training</h2>
            <p className="text-xs text-slate-500 mb-4">
              Submit proposal for council presidential ratification and institutional scheduling.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty Semester Consultation & Strategy"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Type *</label>
                  <select
                    value={requestForm.type}
                    onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value as MeetingType })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="FACULTY_MEETING">Faculty Meeting</option>
                    <option value="COUNCIL_MEETING">Council Meeting</option>
                    <option value="COMMITTEE_MEETING">Committee Meeting</option>
                    <option value="TRAINING_SESSION">Training Session</option>
                    <option value="GENERAL_ASSEMBLY">General Assembly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scope Faculty (Optional)</label>
                  <select
                    value={requestForm.faculty_id}
                    onChange={(e) => setRequestForm({ ...requestForm, faculty_id: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">University-Wide (No Faculty)</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={requestForm.scheduled_date}
                    onChange={(e) => setRequestForm({ ...requestForm, scheduled_date: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="14:00"
                    value={requestForm.start_time}
                    onChange={(e) => setRequestForm({ ...requestForm, start_time: e.target.value })}
                    className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="16:00"
                    value={requestForm.end_time}
                    onChange={(e) => setRequestForm({ ...requestForm, end_time: e.target.value })}
                    className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Venue / Physical Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Council Conference Room 10 / Main Hall"
                  value={requestForm.venue}
                  onChange={(e) => setRequestForm({ ...requestForm, venue: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Agenda * (min 10 chars)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Order of business, discussion points, and targeted outcomes..."
                  value={requestForm.agenda}
                  onChange={(e) => setRequestForm({ ...requestForm, agenda: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Presidential Review</h2>
            <p className="text-xs text-slate-500 mb-4">{reviewingMeeting.title}</p>

            <form onSubmit={handleReviewMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Review Decision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-4 h-4 text-emerald-600" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      reviewAction === 'REJECTED'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <X className="w-4 h-4 text-rose-600" /> Reject
                  </button>
                </div>
              </div>

              {reviewAction === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Scheduling conflict with General Assembly"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewingMeeting(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Minutes Modal */}
      {recordingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Record Official Minutes & Resolutions
            </h2>
            <p className="text-xs text-slate-500 mb-4">{recordingMeeting.title}</p>

            <form onSubmit={handleRecordMinutes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Certified Session Minutes * (min 15 chars)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record summary of proceedings, debates, committee reports, and deliberations..."
                  value={minutesForm.minutes}
                  onChange={(e) => setMinutesForm({ ...minutesForm, minutes: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Council Resolutions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="1. Approved XYZ initiative. 2. Directed committee to execute..."
                  value={minutesForm.official_resolutions}
                  onChange={(e) => setMinutesForm({ ...minutesForm, official_resolutions: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Attendance Count *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={minutesForm.attendance_count}
                  onChange={(e) => setMinutesForm({ ...minutesForm, attendance_count: Number(e.target.value) })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRecordingMeeting(null)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || minutesForm.minutes.trim().length < 15}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Certifying...' : 'Certify & Complete Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
