import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Download, FileText, Shield, Users, Building2,
  DollarSign, AlertCircle, CheckCircle, RefreshCw, BarChart3,
} from 'lucide-react';
import { api } from '../../services/api';
import { FinancialAnalyticsOverview, FacultyPerformanceReport, CommitteeGovernanceAnalytics } from '@keydso/shared-types';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'blue',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function FinancialTab({ data }: { data: FinancialAnalyticsOverview }) {
  const collectionPieData = [
    { name: 'Collected', value: data.total_collected_revenue },
    { name: 'Outstanding', value: data.total_outstanding_debt },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Collection Rate"
          value={`${data.collection_rate_percentage}%`}
          sub={`$${data.total_collected_revenue.toFixed(2)} of $${data.total_expected_revenue.toFixed(2)}`}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Net Treasury Balance"
          value={`$${data.net_available_cash.toFixed(2)}`}
          sub="Verified available balance"
          color="blue"
        />
        <StatCard
          icon={AlertCircle}
          label="Outstanding Debt"
          value={`$${data.total_outstanding_debt.toFixed(2)}`}
          sub="Unrecovered obligations"
          color="red"
        />
        <StatCard
          icon={CheckCircle}
          label="Verified Transactions"
          value={data.total_verified_transactions}
          sub={`${data.total_pending_verifications} pending`}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cashflow Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Cashflow Trend</h3>
          {data.cashflow_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.cashflow_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="credits" stroke="#10b981" name="Credits" strokeWidth={2} dot />
                <Line type="monotone" dataKey="debits" stroke="#ef4444" name="Debits" strokeWidth={2} dot />
                <Line type="monotone" dataKey="net" stroke="#2563eb" name="Net" strokeWidth={2} dot strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No trend data yet</div>
          )}
        </div>

        {/* Collection Pie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Obligation Coverage</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={collectionPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {collectionPieData.map((_, idx) => (
                  <Cell key={idx} fill={idx === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Faculty Collection Table */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Faculty Collection Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.faculty_collection_breakdown} margin={{ left: 10, right: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="faculty_code" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, '']} />
            <Legend />
            <Bar dataKey="expected_amount" name="Expected" fill="#bfdbfe" />
            <Bar dataKey="collected_amount" name="Collected" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Faculty</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Students</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Expected</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Collected</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Rate</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.faculty_collection_breakdown.map((f) => (
                <tr key={f.faculty_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{f.faculty_name}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{f.total_students}</td>
                  <td className="px-3 py-2 text-right text-gray-600">${f.expected_amount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right text-green-600">${f.collected_amount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-semibold ${f.collection_rate >= 80 ? 'text-green-600' : f.collection_rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {f.collection_rate}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-red-500">${f.outstanding_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Category Breakdown */}
      {data.expense_category_breakdown.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Expenditure Category Breakdown</h3>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.expense_category_breakdown}
                  dataKey="total_amount"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ category, percentage }: any) => `${category}: ${percentage}%`}
                >
                  {data.expense_category_breakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function FacultyPerformanceTab({ data }: { data: FacultyPerformanceReport[] }) {
  return (
    <div className="space-y-5">
      {/* Composite Score Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Faculty Performance Composite Score (0–100)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 70, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="faculty_code" tick={{ fontSize: 11 }} width={65} />
            <Tooltip />
            <Bar dataKey="performance_score" name="Composite Score" radius={[0, 4, 4, 0]}>
              {data.map((f, idx) => (
                <Cell key={idx} fill={f.performance_score >= 70 ? '#10b981' : f.performance_score >= 40 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Faculty Ranking Table */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Detailed Faculty Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Rank</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Faculty</th>
                <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Representative</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Students</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Collection</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Issue Resolution</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Meetings</th>
                <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((f, idx) => (
                <tr key={f.faculty_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-800">{f.faculty_name}</td>
                  <td className="px-3 py-2 text-gray-600">{f.dean_or_representative_name}</td>
                  <td className="px-3 py-2 text-right">{f.total_students}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-medium ${f.collection_rate >= 80 ? 'text-green-600' : f.collection_rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      {f.collection_rate}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-medium ${f.resolution_rate >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                      {f.resolved_challenges}/{f.total_challenges} ({f.resolution_rate}%)
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{f.meetings_conducted}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${f.performance_score >= 70 ? 'bg-green-50 text-green-700' : f.performance_score >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                      {f.performance_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GovernanceTab({ data }: { data: CommitteeGovernanceAnalytics }) {
  const committeeData = data.committee_breakdowns.map((c) => ({
    name: c.code,
    members: c.member_count,
    tasks: c.task_count,
    completed: c.completed_task_count,
    rate: c.completion_rate,
  }));

  const meetingTypeData = Object.entries(data.meeting_analytics.meetings_by_type).map(([type, count]) => ({
    name: type.replace('_', ' '),
    value: count,
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Committees" value={data.total_committees} color="blue" />
        <StatCard icon={Users} label="Committee Members" value={data.total_active_members} color="purple" />
        <StatCard icon={CheckCircle} label="Task Completion" value={`${data.task_completion_rate}%`}
          sub={`${data.tasks_completed} of ${data.total_tasks_assigned}`} color="green" />
        <StatCard icon={BarChart3} label="Meetings Logged" value={data.meeting_analytics.total_meetings}
          sub={`${data.meeting_analytics.completed_meetings} completed`} color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Committee Performance */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Committee Task Completion</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={committeeData} margin={{ bottom: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="tasks" name="Total Tasks" fill="#bfdbfe" />
              <Bar dataKey="completed" name="Completed" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Meeting Types */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Meetings by Type</h3>
          {meetingTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={meetingTypeData} dataKey="value" cx="50%" cy="50%" outerRadius={75}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {meetingTypeData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No meeting data</div>
          )}
        </div>
      </div>

      {/* Committee Details Table */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Committee Performance Details</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Committee</th>
              <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Chairperson</th>
              <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Members</th>
              <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Tasks</th>
              <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.committee_breakdowns.map((c) => (
              <tr key={c.committee_id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.code}</div>
                </td>
                <td className="px-3 py-2 text-gray-600">{c.chairperson}</td>
                <td className="px-3 py-2 text-right">{c.member_count}</td>
                <td className="px-3 py-2 text-right">{c.task_count}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`font-semibold ${c.completion_rate >= 70 ? 'text-green-600' : c.completion_rate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                    {c.completion_rate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = useState<'financial' | 'faculty' | 'governance' | 'audit'>('financial');

  const { data: financialData, isLoading: loadingFinancial, error: financialError, refetch: refetchFinancial } =
    useQuery({ queryKey: ['reports', 'financial-overview'], queryFn: () => api.getFinancialOverview() });

  const { data: facultyData, isLoading: loadingFaculty } =
    useQuery({ queryKey: ['reports', 'faculty-performance'], queryFn: () => api.getFacultyPerformance() });

  const { data: governanceData, isLoading: loadingGovernance } =
    useQuery({ queryKey: ['reports', 'governance-analytics'], queryFn: () => api.getGovernanceAnalytics() });

  const { data: auditData, isLoading: loadingAudit } =
    useQuery({ queryKey: ['reports', 'audit-export'], queryFn: () => api.getAuditExport(), enabled: activeTab === 'audit' });

  const tabs = [
    { key: 'financial', label: 'Financial Analytics', icon: TrendingUp },
    { key: 'faculty', label: 'Faculty Performance', icon: Building2 },
    { key: 'governance', label: 'Governance & Committees', icon: Users },
    { key: 'audit', label: 'Audit Export', icon: Shield },
  ] as const;

  const handleDownloadCsv = async () => {
    try {
      await api.downloadFinancialCsv();
    } catch (e) {
      alert('Failed to download CSV. Please try again.');
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={26} className="text-blue-600" />
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Institutional performance, financial reconciliation, and governance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { refetchFinancial(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'financial' && (
        loadingFinancial ? (
          <div className="flex justify-center py-16 text-gray-400">Loading financial analytics…</div>
        ) : financialError ? (
          <div className="bg-red-50 text-red-700 rounded-xl p-5 text-sm">
            Failed to load financial analytics. You may not have the required role.
          </div>
        ) : financialData ? (
          <FinancialTab data={financialData} />
        ) : null
      )}

      {activeTab === 'faculty' && (
        loadingFaculty ? (
          <div className="flex justify-center py-16 text-gray-400">Loading faculty performance…</div>
        ) : facultyData && facultyData.length > 0 ? (
          <FacultyPerformanceTab data={facultyData} />
        ) : (
          <div className="bg-gray-50 rounded-xl p-10 text-center text-gray-400">No faculty data available.</div>
        )
      )}

      {activeTab === 'governance' && (
        loadingGovernance ? (
          <div className="flex justify-center py-16 text-gray-400">Loading governance metrics…</div>
        ) : governanceData ? (
          <GovernanceTab data={governanceData} />
        ) : null
      )}

      {activeTab === 'audit' && (
        loadingAudit ? (
          <div className="flex justify-center py-16 text-gray-400">Generating cryptographic audit report…</div>
        ) : auditData ? (
          <div className="space-y-5">
            {/* Audit Header */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Shield size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">Official Institutional Audit Report</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Generated: {new Date(auditData.generated_at).toLocaleString()} · By: {auditData.generated_by}
                    ({auditData.generated_by_role})
                  </p>
                  <p className="text-sm text-gray-500">Academic Year: {auditData.academic_year}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${auditData.ledger_verification.reconciled ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {auditData.ledger_verification.reconciled ? '✓ Reconciled' : '⚠ Discrepancy'}
                </div>
              </div>
            </div>

            {/* Ledger Verification */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-green-600" /> Ledger Cryptographic Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium">Total Credits</p>
                  <p className="text-xl font-bold text-green-700">${auditData.ledger_verification.total_credits.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 font-medium">Total Debits</p>
                  <p className="text-xl font-bold text-red-700">${auditData.ledger_verification.total_debits.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium">Net Position</p>
                  <p className="text-xl font-bold text-blue-700">
                    ${(auditData.ledger_verification.total_credits - auditData.ledger_verification.total_debits).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">SHA-256 Ledger Integrity Checksum</p>
                <code className="text-xs text-gray-700 break-all">{auditData.ledger_verification.checksum}</code>
              </div>
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FileText size={16} /> Institutional Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(auditData.summary).map(([key, val]) => (
                  <div key={key} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-400 font-medium mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-base font-bold text-gray-800">
                      {typeof val === 'number' ? (key.includes('volume') || key.includes('amount') ? `$${(val as number).toFixed(2)}` : val) : String(val)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400 text-center">
              Total audit records indexed: {auditData.records_count} · Report type: {auditData.report_type}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}
