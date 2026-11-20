import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CouncilDashboardOverview } from '@keydso/shared-types';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export const CouncilDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<CouncilDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getCouncilDashboard();
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load council dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error || 'Unable to load executive metrics'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-sky-950 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-1">
              <LayoutDashboard className="w-4 h-4" />
              Executive Council Operations Hub
            </div>
            <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              "Every Contribution Matters. Every Action Is Accountable." University Student Representative Council central command.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/governance/challenges"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              Review Challenges ({data.open_challenges_count})
            </Link>
            <Link
              to="/governance/meetings"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-white/20"
            >
              <Calendar className="w-4 h-4" />
              Meetings Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Student Body</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.total_students.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across {data.total_faculties} Faculties</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Council Treasury Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${data.total_funds_balance.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {data.active_campaigns_count} Active Campaigns
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Committees</span>
            <Briefcase className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.active_committees_count}</div>
          <div className="text-[11px] text-slate-400 mt-1">Welfare, Tech, Academics, Sports</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Open Challenges</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{data.open_challenges_count}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">
            {data.open_challenges_count === 0 ? 'All issues addressed' : 'Awaiting representative action'}
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Student & Faculty Challenges */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Recent Faculty Challenges & Student Issues
            </h2>
            <Link to="/governance/challenges" className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data.recent_challenges.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No recent student challenges reported.
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_challenges.map((issue) => (
                <div key={issue.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500 px-1.5 py-0.5 bg-white rounded border border-slate-200">
                        {issue.reference_number}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                        issue.priority === 'CRITICAL' || issue.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {issue.priority}
                      </span>
                      <span className="text-slate-400 font-medium">{issue.faculty_name || 'University-wide'}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{issue.title}</div>
                    <p className="text-slate-600 line-clamp-1 mt-0.5">{issue.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                    issue.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings & Training Sessions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              Council & Faculty Assembly Schedule
            </h2>
            <Link to="/governance/meetings" className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1">
              View Schedule <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {data.upcoming_meetings.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500">
              No upcoming meetings currently scheduled.
            </div>
          ) : (
            <div className="space-y-3">
              {data.upcoming_meetings.map((meeting) => (
                <div key={meeting.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold text-[10px]">
                        {meeting.type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 font-medium">{meeting.scheduled_date} • {meeting.start_time} - {meeting.end_time}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{meeting.title}</div>
                    <div className="text-slate-500 mt-0.5">Venue: <strong className="text-slate-700">{meeting.venue}</strong></div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${
                    meeting.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {meeting.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
