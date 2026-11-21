import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';

interface Props {
  studentName?: string;
  studentId?: string;
  facultyName?: string;
}

export const StudentPortalDashboardView: React.FC<Props> = ({
  studentName = 'Mohamed Ali',
  studentId = 'STU-2025-001',
  facultyName = 'Engineering',
}) => {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
            {studentName.charAt(0)}
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">Welcome, {studentName}</h4>
            <div className="text-muted small">
              Student ID: <span className="font-monospace fw-semibold text-km-primary">{studentId}</span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-shield-lock"></i>
            <span>Change Password</span>
          </button>
          <button
            onClick={() => navigate('/portal/contributions')}
            className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
            style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
          >
            <i className="bi bi-receipt"></i>
            <span>My Receipts</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Quick Cards matching screenshot */}
      <div className="row g-3">
        {/* Contribution Card */}
        <div className="col-12 col-md-4">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-cash-stack fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">$50</div>
              <div className="text-muted small mt-1">My Contribution</div>
            </div>
          </div>
        </div>

        {/* Receipts Card */}
        <div className="col-12 col-md-4">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}
            >
              <i className="bi bi-file-earmark-check fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">3</div>
              <div className="text-muted small mt-1">Receipts</div>
            </div>
          </div>
        </div>

        {/* My Faculty Card */}
        <div className="col-12 col-md-4">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(37, 168, 224, 0.12)', color: '#25A8E0' }}
            >
              <i className="bi bi-mortarboard fs-4"></i>
            </div>
            <div>
              <div className="fs-4 fw-bold text-dark lh-1 text-truncate">{facultyName}</div>
              <div className="text-muted small mt-1">My Faculty</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section: Contribution History & Announcements matching screenshot */}
      <div className="row g-3">
        {/* Left: Contribution History */}
        <div className="col-12 col-lg-7">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 className="fw-bold mb-0 text-dark">Contribution History</h6>
                <div className="text-muted small">Verified payments and official university receipts</div>
              </div>
              <button
                onClick={() => navigate('/portal/contributions')}
                className="btn btn-link text-km-primary text-decoration-none small fw-semibold p-0"
              >
                View All &rarr;
              </button>
            </div>

            <div className="d-flex flex-column gap-2.5 flex-grow-1">
              {/* Payment Row 1 */}
              <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-light">
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-success bg-success bg-opacity-10"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Apr 25, 2025</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Ref: TRX-2025-001 &bull; Semester 2 Contribution
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold text-dark">$50.00</div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small" style={{ fontSize: '0.7rem' }}>
                    Paid
                  </span>
                </div>
              </div>

              {/* Payment Row 2 */}
              <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-light">
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-success bg-success bg-opacity-10"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Jan 15, 2025</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Ref: TRX-2024-889 &bull; Semester 1 Contribution
                    </div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold text-dark">$50.00</div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small" style={{ fontSize: '0.7rem' }}>
                    Paid
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Announcements */}
        <div className="col-12 col-lg-5">
          <div className="dashboard-card p-4 h-100 d-flex flex-column">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0 text-dark">Announcements</h6>
              <i className="bi bi-megaphone-fill text-km-cyan"></i>
            </div>

            <div className="d-flex flex-column gap-2.5 flex-grow-1">
              <div className="p-3 rounded-3 border bg-light">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill" style={{ fontSize: '0.68rem' }}>
                    GOVERNANCE
                  </span>
                  <span className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                    Apr 20, 2025
                  </span>
                </div>
                <div className="fw-bold small text-dark">University Council Workings</div>
                <div className="text-muted mt-1 small" style={{ fontSize: '0.78rem' }}>
                  The Executive Council has published the Semester 2 Transparency Agenda &amp; Allocation Ledger.
                </div>
              </div>

              <div className="p-3 rounded-3 border bg-light">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill" style={{ fontSize: '0.68rem' }}>
                    TRAINING
                  </span>
                  <span className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                    Apr 18, 2025
                  </span>
                </div>
                <div className="fw-bold small text-dark">New training for students</div>
                <div className="text-muted mt-1 small" style={{ fontSize: '0.78rem' }}>
                  Student leadership and digital literacy workshops open for registration across all faculties.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
