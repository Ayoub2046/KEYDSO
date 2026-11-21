import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  userName?: string;
}

const contributionData = [
  { month: 'Jan', paid: 8500, pending: 3200 },
  { month: 'Feb', paid: 9800, pending: 4100 },
  { month: 'Mar', paid: 11200, pending: 3800 },
  { month: 'Apr', paid: 12450, pending: 2900 },
  { month: 'May', paid: 13900, pending: 2200 },
  { month: 'Jun', paid: 15100, pending: 1800 },
];

export const SystemAdminDashboardView: React.FC<Props> = ({ userName = 'Dr. Ahmed Ali' }) => {
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
            <div className="text-muted small">System Administrator</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill bg-light border small text-muted">
            <i className="bi bi-calendar3 text-km-cyan"></i>
            <span className="fw-semibold text-dark">Today</span>
            <span>Apr 25, 2025</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Key Stat Cards Row matching screenshot */}
      <div className="row g-3">
        {/* Faculties Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
            >
              <i className="bi bi-bank fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">12</div>
              <div className="text-muted small mt-1">Faculties</div>
            </div>
          </div>
        </div>

        {/* Departments Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(37, 168, 224, 0.12)', color: '#25A8E0' }}
            >
              <i className="bi bi-diagram-3 fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">48</div>
              <div className="text-muted small mt-1">Departments</div>
            </div>
          </div>
        </div>

        {/* Students Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-people-fill fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">8,450</div>
              <div className="text-muted small mt-1">Students</div>
            </div>
          </div>
        </div>

        {/* Contributions Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
            >
              <i className="bi bi-cash-stack fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">$125,750</div>
              <div className="text-muted small mt-1">Total Contributions</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Chart & Recent Activities */}
      <div className="row g-3">
        {/* Left Chart: Contribution Overview */}
        <div className="col-12 col-lg-8">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Contribution Overview</h6>
                <div className="text-muted small">Semester revenue timeline and obligations</div>
              </div>
              <div className="d-flex align-items-center gap-3 small">
                <span className="d-flex align-items-center gap-1.5 text-muted">
                  <span className="rounded-circle" style={{ width: '9px', height: '9px', backgroundColor: '#10B981' }} />
                  <span>Paid</span>
                </span>
                <span className="d-flex align-items-center gap-1.5 text-muted">
                  <span className="rounded-circle" style={{ width: '9px', height: '9px', backgroundColor: '#F59E0B' }} />
                  <span>Pending</span>
                </span>
              </div>
            </div>

            <div className="flex-grow-1" style={{ minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={contributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#0B2545', borderColor: '#1176BC', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#paidGrad)" />
                  <Area type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#pendingGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Card: Recent Activities matching screenshot */}
        <div className="col-12 col-lg-4">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark">Recent Activities</h6>
              <a href="#activities" className="text-km-primary text-decoration-none small fw-semibold">
                View All &rarr;
              </a>
            </div>

            <div className="d-flex flex-column gap-3 flex-grow-1">
              {/* Item 1 */}
              <div className="d-flex align-items-start gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#1176BC', fontSize: '0.85rem' }}
                >
                  <i className="bi bi-plus-lg"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">New contribution received</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    By Ahmed Mohamed &bull; 2m ago
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="d-flex align-items-start gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#8B5CF6', fontSize: '0.85rem' }}
                >
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">Meeting approved</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    By Finance Committee &bull; 10m ago
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="d-flex align-items-start gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#10B981', fontSize: '0.85rem' }}
                >
                  <i className="bi bi-person-check"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">New student registered</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    By Admin &bull; 15m ago
                  </div>
                </div>
              </div>

              {/* Item 4 */}
              <div className="d-flex align-items-start gap-2.5">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '32px', height: '32px', backgroundColor: '#F59E0B', fontSize: '0.85rem' }}
                >
                  <i className="bi bi-exclamation-triangle"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">Challenge reported</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    By Faculty of Science &bull; 20m ago
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
