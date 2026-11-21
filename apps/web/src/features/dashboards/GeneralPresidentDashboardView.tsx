import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

interface Props {
  userName?: string;
}

const performanceData = [
  { category: 'Academic', thisSemester: 85, lastSemester: 68 },
  { category: 'Financial', thisSemester: 92, lastSemester: 72 },
  { category: 'Activities', thisSemester: 88, lastSemester: 79 },
  { category: 'Engagement', thisSemester: 94, lastSemester: 86 },
];

export const GeneralPresidentDashboardView: React.FC<Props> = ({ userName = 'Prof. Hassan Mohamed' }) => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column gap-3.5">
      {/* 1. Welcome Header Banner matching screenshot */}
      <div className="dashboard-card p-3 p-md-3.5 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #1176BC 0%, #25A8E0 100%)',
              fontSize: '1.15rem',
            }}
          >
            {userName.charAt(0)}
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">Welcome, {userName}</h4>
            <div className="text-muted small">General President</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill bg-light border small text-muted">
            <span className="fw-semibold text-dark">This Semester</span>
            <span>Spring 2025</span>
            <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.75rem' }}></i>
          </div>
        </div>
      </div>

      {/* 2. 4 Key Stat Cards Row matching screenshot */}
      <div className="row g-3">
        {/* Pending Approvals Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="dashboard-stat-icon"
                style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
              >
                <i className="bi bi-hourglass-split fs-4"></i>
              </div>
              <div>
                <div className="fs-3 fw-bold text-dark lh-1">24</div>
                <div className="text-muted small mt-1">Pending Approvals</div>
              </div>
            </div>
            <span className="badge bg-danger rounded-pill px-2 py-1 small">3</span>
          </div>
        </div>

        {/* Council Activities Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(37, 168, 224, 0.12)', color: '#25A8E0' }}
            >
              <i className="bi bi-calendar-check fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">12</div>
              <div className="text-muted small mt-1">Council Activities</div>
            </div>
          </div>
        </div>

        {/* Challenges Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}
            >
              <i className="bi bi-exclamation-triangle fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">7</div>
              <div className="text-muted small mt-1">Challenges</div>
            </div>
          </div>
        </div>

        {/* Execution Rate Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-check-circle fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">95%</div>
              <div className="text-muted small mt-1">Execution Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Chart & Quick Actions */}
      <div className="row g-3">
        {/* Left Chart: Council Performance */}
        <div className="col-12 col-lg-8">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Council Performance</h6>
                <div className="text-muted small">Semester over semester comparison across governance pillars</div>
              </div>
            </div>

            <div className="flex-grow-1" style={{ minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="category" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} unit="%" />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Score']}
                    contentStyle={{ backgroundColor: '#0B2545', borderColor: '#1176BC', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#64748B', fontSize: '12px' }}>{value}</span>}
                  />
                  <Bar name="This Semester" dataKey="thisSemester" fill="#1176BC" radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar name="Last Semester" dataKey="lastSemester" fill="#25A8E0" radius={[4, 4, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Actions matching screenshot */}
        <div className="col-12 col-lg-4">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark">Quick Actions</h6>
              <i className="bi bi-lightning-charge text-km-cyan"></i>
            </div>

            <div className="d-flex flex-column gap-2.5 flex-grow-1 justify-content-center">
              <button
                onClick={() => navigate('/finance/payments/verify')}
                className="btn btn-primary d-flex align-items-center gap-2.5 py-2.5 px-3 text-start w-100 rounded-3 shadow-sm"
                style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
              >
                <i className="bi bi-shield-check fs-5"></i>
                <span className="fw-semibold">Approve Requests</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="btn text-white d-flex align-items-center gap-2.5 py-2.5 px-3 text-start w-100 rounded-3 shadow-sm"
                style={{ backgroundColor: '#8B5CF6' }}
              >
                <i className="bi bi-file-earmark-bar-graph fs-5"></i>
                <span className="fw-semibold">View Reports</span>
              </button>

              <button
                onClick={() => navigate('/governance/challenges')}
                className="btn text-white d-flex align-items-center gap-2.5 py-2.5 px-3 text-start w-100 rounded-3 shadow-sm"
                style={{ backgroundColor: '#F59E0B' }}
              >
                <i className="bi bi-exclamation-octagon fs-5"></i>
                <span className="fw-semibold">Manage Challenges</span>
              </button>

              <button
                onClick={() => navigate('/governance/meetings')}
                className="btn text-white d-flex align-items-center gap-2.5 py-2.5 px-3 text-start w-100 rounded-3 shadow-sm"
                style={{ backgroundColor: '#25A8E0' }}
              >
                <i className="bi bi-calendar-plus fs-5"></i>
                <span className="fw-semibold">Schedule Meeting</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
