import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  userName?: string;
}

const facultyContributionData = [
  { name: 'Engineering', value: 32, color: '#1176BC' },
  { name: 'Medicine', value: 28, color: '#25A8E0' },
  { name: 'Business', value: 24, color: '#F59E0B' },
  { name: 'Science', value: 16, color: '#10B981' },
];

const paymentStatusData = [
  { name: 'Paid', value: 72, color: '#10B981' },
  { name: 'Pending', value: 18, color: '#F59E0B' },
  { name: 'Refused', value: 10, color: '#EF4444' },
];

export const FinanceCommitteeDashboardView: React.FC<Props> = ({ userName = 'Finance Committee' }) => {
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
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              fontSize: '1.15rem',
            }}
          >
            <i className="bi bi-wallet2 text-white"></i>
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">Welcome, {userName}</h4>
            <div className="text-muted small">Financial Oversight</div>
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
        {/* Total Collected Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-cash-coin fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">$18,750</div>
              <div className="text-muted small mt-1">Total Collected</div>
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}
            >
              <i className="bi bi-hourglass-split fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">$5,250</div>
              <div className="text-muted small mt-1">Pending</div>
            </div>
          </div>
        </div>

        {/* Collection Rate Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
            >
              <i className="bi bi-graph-up fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">72%</div>
              <div className="text-muted small mt-1">Collection Rate</div>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}
            >
              <i className="bi bi-receipt fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">$3,200</div>
              <div className="text-muted small mt-1">Expenses</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Two Donut Charts matching screenshot */}
      <div className="row g-3">
        {/* Left Chart: Contribution by Faculty */}
        <div className="col-12 col-lg-6">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <h6 className="fw-bold mb-1 text-dark">Contribution by Faculty</h6>
            <div className="text-muted small mb-3">Distribution across active departments</div>

            <div className="row align-items-center flex-grow-1">
              <div className="col-12 col-sm-6 position-relative d-flex justify-content-center">
                <div style={{ width: '180px', height: '180px' }} className="position-relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={facultyContributionData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {facultyContributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text $18.7K from screenshot */}
                  <div
                    className="position-absolute top-50 start-50 translate-middle text-center"
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="fs-5 fw-bold text-dark lh-1">$18.7K</div>
                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>Total</div>
                  </div>
                </div>
              </div>

              {/* Legend matching screenshot */}
              <div className="col-12 col-sm-6 mt-3 mt-sm-0">
                <div className="d-flex flex-column gap-2">
                  {facultyContributionData.map((item) => (
                    <div key={item.name} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: item.color }} />
                        <span className="small text-dark fw-medium">{item.name}</span>
                      </div>
                      <span className="small fw-bold text-dark">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Chart: Payment Status */}
        <div className="col-12 col-lg-6">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <h6 className="fw-bold mb-1 text-dark">Payment Status</h6>
            <div className="text-muted small mb-3">Verified vs outstanding obligations</div>

            <div className="row align-items-center flex-grow-1">
              <div className="col-12 col-sm-6 position-relative d-flex justify-content-center">
                <div style={{ width: '180px', height: '180px' }} className="position-relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-status-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Status']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text 72% from screenshot */}
                  <div
                    className="position-absolute top-50 start-50 translate-middle text-center"
                    style={{ pointerEvents: 'none' }}
                  >
                    <div className="fs-4 fw-bold text-success lh-1">72%</div>
                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>Collected</div>
                  </div>
                </div>
              </div>

              {/* Legend matching screenshot */}
              <div className="col-12 col-sm-6 mt-3 mt-sm-0">
                <div className="d-flex flex-column gap-2">
                  {paymentStatusData.map((item) => (
                    <div key={item.name} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span className="rounded-circle" style={{ width: '10px', height: '10px', backgroundColor: item.color }} />
                        <span className="small text-dark fw-medium">{item.name}</span>
                      </div>
                      <span className="small fw-bold text-dark">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
