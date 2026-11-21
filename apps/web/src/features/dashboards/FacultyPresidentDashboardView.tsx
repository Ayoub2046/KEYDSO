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

interface Props {
  userName?: string;
  facultyName?: string;
}

const facultyActivityData = [
  { month: 'Jan', activities: 6, target: 8 },
  { month: 'Feb', activities: 8, target: 8 },
  { month: 'Mar', activities: 10, target: 9 },
  { month: 'Apr', activities: 12, target: 10 },
  { month: 'May', activities: 14, target: 12 },
  { month: 'Jun', activities: 16, target: 12 },
];

export const FacultyPresidentDashboardView: React.FC<Props> = ({
  userName = 'Dr. Amina Farah',
  facultyName = 'Faculty of Engineering',
}) => {
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
            <div className="text-muted small">Faculty President &bull; {facultyName}</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill bg-light border small text-muted">
            <span className="fw-semibold text-dark">{facultyName}</span>
            <i className="bi bi-chevron-down ms-1" style={{ fontSize: '0.75rem' }}></i>
          </div>
        </div>
      </div>

      {/* 2. 4 Key Stat Cards Row matching screenshot */}
      <div className="row g-3">
        {/* Students Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
            >
              <i className="bi bi-people-fill fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">1,250</div>
              <div className="text-muted small mt-1">Students</div>
            </div>
          </div>
        </div>

        {/* Paid Members Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-patch-check-fill fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">420</div>
              <div className="text-muted small mt-1">Paid Members</div>
            </div>
          </div>
        </div>

        {/* Meetings Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(37, 168, 224, 0.12)', color: '#25A8E0' }}
            >
              <i className="bi bi-calendar-event fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">12</div>
              <div className="text-muted small mt-1">Meetings</div>
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
              <div className="fs-3 fw-bold text-dark lh-1">8</div>
              <div className="text-muted small mt-1">Challenges</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Chart & Upcoming Events */}
      <div className="row g-3">
        {/* Left Chart: Faculty Activities */}
        <div className="col-12 col-lg-8">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Faculty Activities</h6>
                <div className="text-muted small">Completed events vs quarterly targets</div>
              </div>
            </div>

            <div className="flex-grow-1" style={{ minHeight: '260px' }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={facultyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(value: any, name: any) => [value, name === 'activities' ? 'Activities' : 'Target']}
                    contentStyle={{ backgroundColor: '#0B2545', borderColor: '#1176BC', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#64748B', fontSize: '12px' }}>{value}</span>}
                  />
                  <Bar name="Activities" dataKey="activities" fill="#1176BC" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar name="Target" dataKey="target" fill="#25A8E0" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Card: Upcoming Events matching screenshot */}
        <div className="col-12 col-lg-4">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark">Upcoming Events</h6>
              <a href="#events" className="text-km-primary text-decoration-none small fw-semibold">
                View All &rarr;
              </a>
            </div>

            <div className="d-flex flex-column gap-3 flex-grow-1">
              {/* Event 1 */}
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-3 hover-bg-light">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#1176BC', fontSize: '0.9rem' }}
                >
                  <i className="bi bi-mortarboard-fill"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">Faculty Training</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Apr 28, 2025 &bull; 9:00 AM
                  </div>
                </div>
              </div>

              {/* Event 2 */}
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-3 hover-bg-light">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#25A8E0', fontSize: '0.9rem' }}
                >
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">General Meeting</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Apr 30, 2025 &bull; 10:00 AM
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="d-flex align-items-start gap-2.5 p-2 rounded-3 hover-bg-light">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: '#10B981', fontSize: '0.9rem' }}
                >
                  <i className="bi bi-chat-dots-fill"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="fw-semibold text-dark small text-truncate">Engineering Forum</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    May 5, 2025 &bull; 2:00 PM
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
