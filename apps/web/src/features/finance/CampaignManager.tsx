import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ContributionCampaign,
  AcademicYear,
  Semester,
  Fund,
  RoleName,
} from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import {
  DollarSign,
  Plus,
  CheckCircle2,
  Clock,
  Target,
  Users,
  AlertCircle,
  Sparkles,
  Calendar,
  Building,
} from 'lucide-react';

export const CampaignManager: React.FC = () => {
  const { user } = useAuthStore();
  const roles = user?.roles || [];
  const canApprove =
    roles.includes(RoleName.GENERAL_PRESIDENT) || roles.includes(RoleName.SYSTEM_ADMIN);
  const canCreate =
    roles.includes(RoleName.FINANCE_OFFICER) || roles.includes(RoleName.SYSTEM_ADMIN);

  const [campaigns, setCampaigns] = useState<ContributionCampaign[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedAyId, setSelectedAyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    purpose: '',
    target_amount: 5000,
    contribution_amount: 25,
    campaign_type: 'FIXED_PER_STUDENT',
    scope_type: 'UNIVERSITY_WIDE',
    fund_id: '',
    academic_year_id: '',
    semester_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [campRes, ayRes, fundsRes] = await Promise.all([
        api.getCampaigns(selectedAyId || undefined),
        api.getAcademicYears(),
        api.getFunds(),
      ]);
      setCampaigns(campRes);
      setAcademicYears(ayRes);
      setFunds(fundsRes);

      if (ayRes.length > 0 && !formData.academic_year_id) {
        const currentAy = ayRes.find((a) => a.is_current) || ayRes[0];
        setFormData((prev) => ({
          ...prev,
          academic_year_id: currentAy.id,
          fund_id: fundsRes[0]?.id || '',
        }));
        const semRes = await api.getSemesters(currentAy.id);
        setSemesters(semRes);
        if (semRes.length > 0) {
          setFormData((prev) => ({ ...prev, semester_id: semRes[0].id }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAyId]);

  const handleAyChange = async (ayId: string) => {
    setFormData((prev) => ({ ...prev, academic_year_id: ayId }));
    const semRes = await api.getSemesters(ayId);
    setSemesters(semRes);
    if (semRes.length > 0) {
      setFormData((prev) => ({ ...prev, semester_id: semRes[0].id }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createCampaign({
        ...formData,
        target_amount: Number(formData.target_amount),
        contribution_amount: Number(formData.contribution_amount),
      });
      setSuccessMsg(`Campaign "${formData.title}" created in DRAFT status`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to approve "${title}"?\nThis will activate the campaign and auto-generate contribution obligations for all eligible students.`)) {
      return;
    }
    try {
      setError(null);
      const res = await api.approveCampaign(id);
      setSuccessMsg(`Campaign approved! Successfully generated ${res.generated_obligations} student obligations.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve campaign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-sky-600" />
            Contribution Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure contribution rules, track collection progress, and generate verified student obligations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAyId}
            onChange={(e) => setSelectedAyId(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Academic Years</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} {ay.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Campaign
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

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No campaigns found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {canCreate ? 'Create a contribution campaign to begin collecting student council contributions.' : 'No active or draft campaigns available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((camp) => {
            const expected = Number(camp.total_expected || 0);
            const collected = Number(camp.total_collected || 0);
            const percentage = camp.collection_rate_percentage || (expected > 0 ? Math.round((collected / expected) * 100) : 0);
            const isActive = camp.status === 'ACTIVE';
            const isDraft = camp.status === 'DRAFT';

            return (
              <div
                key={camp.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mb-1">
                        {camp.code}
                      </span>
                      <h2 className="text-lg font-bold text-slate-900">{camp.title}</h2>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDraft
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {camp.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{camp.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Contribution Rate</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">${camp.contribution_amount} / student</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <div className="text-slate-500">Target Goal</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">${camp.target_amount.toLocaleString()}</div>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg col-span-2 sm:col-span-1">
                      <div className="text-slate-500">Obligations</div>
                      <div className="font-bold text-slate-800 text-sm mt-0.5">{camp.obligations_count || 0} students</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>Collected: ${collected.toLocaleString()}</span>
                      <span>{percentage}% of ${expected.toLocaleString()} expected</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          percentage >= 100 ? 'bg-emerald-500' : 'bg-sky-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      Fund: <strong className="text-slate-600 font-medium">{camp.fund_name || 'General Treasury'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {camp.start_date} → {camp.end_date}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {isDraft && canApprove && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Awaiting President Approval
                    </span>
                    <button
                      onClick={() => handleApprove(camp.id, camp.title)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Approve & Ratify
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 my-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create Contribution Campaign</h2>
            <p className="text-xs text-slate-500 mb-5">
              Draft a new financial campaign. Once submitted, the General President must approve it before obligations are published.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Semester 2 Welfare & Campus Drive"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAMP-2026-S2"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full text-sm uppercase font-mono border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT lab network switches and student emergency welfare fund"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Public Description * (min 10 chars)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed explanation of the campaign visible to all students on their portal..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution ($) *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={formData.contribution_amount}
                    onChange={(e) => setFormData({ ...formData, contribution_amount: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Amount ($) *</label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    required
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: Number(e.target.value) })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Treasury Fund *</label>
                  <select
                    value={formData.fund_id}
                    onChange={(e) => setFormData({ ...formData, fund_id: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {funds.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} (Bal: ${f.current_balance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year *</label>
                  <select
                    value={formData.academic_year_id}
                    onChange={(e) => handleAyChange(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester *</label>
                  <select
                    value={formData.semester_id}
                    onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Draft Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
