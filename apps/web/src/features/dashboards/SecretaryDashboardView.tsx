import React from 'react';

interface Props {
  userName?: string;
}

export const SecretaryDashboardView: React.FC<Props> = ({ userName = 'Council Secretary' }) => {
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
            <div className="text-muted small">Council Secretary &bull; Records &amp; Resolutions</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-pill bg-light border small text-muted">
            <i className="bi bi-calendar3 text-km-cyan"></i>
            <span className="fw-semibold text-dark">Spring 2025</span>
          </div>
        </div>
      </div>

      {/* 2. 4 Key Stat Cards Row matching screenshot */}
      <div className="row g-3">
        {/* Minutes Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(17, 118, 188, 0.12)', color: '#1176BC' }}
            >
              <i className="bi bi-journal-text fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">10</div>
              <div className="text-muted small mt-1">Minutes</div>
            </div>
          </div>
        </div>

        {/* Letters Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <i className="bi bi-envelope-paper fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">5</div>
              <div className="text-muted small mt-1">Letters</div>
            </div>
          </div>
        </div>

        {/* Decisions Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}
            >
              <i className="bi bi-award fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">3</div>
              <div className="text-muted small mt-1">Decisions</div>
            </div>
          </div>
        </div>

        {/* Archived Card */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="dashboard-card p-3.5 d-flex align-items-center gap-3">
            <div
              className="dashboard-stat-icon"
              style={{ backgroundColor: 'rgba(37, 168, 224, 0.12)', color: '#25A8E0' }}
            >
              <i className="bi bi-archive fs-4"></i>
            </div>
            <div>
              <div className="fs-3 fw-bold text-dark lh-1">100%</div>
              <div className="text-muted small mt-1">Archived</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Documents Card matching screenshot */}
      <div className="dashboard-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-dark">Recent Documents</h6>
            <div className="text-muted small">Official minutes, resolutions, and formal correspondence</div>
          </div>
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
            Repository
          </span>
        </div>

        <div className="d-flex flex-column gap-2.5">
          {/* Doc 1 */}
          <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-light">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-primary bg-primary bg-opacity-10"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-file-earmark-pdf fs-5"></i>
              </div>
              <div>
                <div className="fw-bold small text-dark">Council Meeting Minutes - Apr 2025</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Recorded on Apr 24, 2025 &bull; 8 Attendees &bull; Ratified
                </div>
              </div>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5"
              onClick={() => alert('Downloading official council minutes PDF...')}
            >
              <i className="bi bi-download"></i>
              <span className="d-none d-sm-inline">Download</span>
            </button>
          </div>

          {/* Doc 2 */}
          <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border bg-light">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-success bg-success bg-opacity-10"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-file-earmark-word fs-5"></i>
              </div>
              <div>
                <div className="fw-bold small text-dark">Official Letter to Faculties</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Dispatched on Apr 22, 2025 &bull; Ref: SEC-2025-014
                </div>
              </div>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5"
              onClick={() => alert('Downloading official letter...')}
            >
              <i className="bi bi-download"></i>
              <span className="d-none d-sm-inline">Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
