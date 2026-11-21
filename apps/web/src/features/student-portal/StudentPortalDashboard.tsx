import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentPortalOverview, StudentReceipt } from '@keydso/shared-types';
import { ReceiptModal } from './ReceiptModal';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';

export const StudentPortalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<StudentPortalOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<StudentReceipt | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const res = await api.getPortalOverview();
      setData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small mt-2">Loading Student Portal...</div>
      </div>
    );
  }

  const { student, total_expected, total_paid, total_remaining, campaigns, representatives, announcements } = data;

  return (
    <div className="container-fluid py-2">
      {/* Student Profile Header Card */}
      <div
        className="card border-0 shadow-lg rounded-4 text-white p-4 mb-4 glass-panel-dark position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(9, 14, 23, 0.95) 0%, rgba(16, 33, 61, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100"
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 50%, #818cf8 100%)',
          }}
        />
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center bg-primary bg-opacity-25 border border-primary border-opacity-50 rounded-4 text-info fw-bold shadow-sm glass-glow-primary"
              style={{ width: '64px', height: '64px' }}
            >
              <i className="bi bi-mortarboard fs-2 text-info"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0 text-white">{student.full_name}</h4>
                <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-40 rounded-pill px-2.5 py-1">
                  {student.enrollment_status}
                </span>
              </div>
              <div className="text-info-emphasis small font-monospace mt-1">
                ID: <strong>{student.student_id_number}</strong> &middot; {student.faculty_name} ({student.department_name})
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn btn-outline-warning btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
            >
              <i className="bi bi-key-fill text-warning"></i>
              <span>Change Password</span>
            </button>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="btn btn-primary btn-sm rounded-pill px-3.5 shadow-sm d-flex align-items-center gap-1.5 fw-semibold"
            >
              <i className="bi bi-chat-left-text"></i>
              <span>Submit Issue to Reps</span>
            </button>
            <button
              onClick={() => navigate('/portal/transparency')}
              className="btn btn-outline-light btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
            >
              <i className="bi bi-shield-check text-info"></i>
              <span>Spending Transparency</span>
            </button>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5 flex-shrink-0"></i>
          <div className="small fw-semibold">{notificationMsg}</div>
        </div>
      )}

      {/* Financial Health Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4 glass-card-hover bg-white border-top border-4 border-primary">
            <div className="text-muted small fw-semibold text-uppercase tracking-wider">
              Total Obligations
            </div>
            <div className="fs-3 fw-bold text-dark mt-1">${total_expected.toFixed(2)}</div>
            <div className="small text-muted mt-1">Assessed semester contributions</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4 glass-card-hover bg-white border-top border-4 border-success">
            <div className="text-success small fw-semibold text-uppercase tracking-wider">
              Verified Collections
            </div>
            <div className="fs-3 fw-bold text-success mt-1">${total_paid.toFixed(2)}</div>
            <div className="small text-success mt-1 d-flex align-items-center gap-1">
              <i className="bi bi-check-circle-fill"></i>
              <span>Officially verified by Finance</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-4 glass-card-hover bg-white border-top border-4 border-warning">
            <div className="text-warning small fw-semibold text-uppercase tracking-wider">
              Remaining Balance
            </div>
            <div className="fs-3 fw-bold text-warning mt-1">${total_remaining.toFixed(2)}</div>
            <div className="small text-muted mt-1">
              {total_remaining === 0 ? 'All dues up to date' : 'Outstanding contribution obligation'}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Campaigns & Announcements */}
        <div className="col-12 col-lg-8">
          {/* Active Campaigns Card */}
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-flag-fill text-primary"></i>
                <span>My Active Contribution Campaigns</span>
              </h5>
              <button
                onClick={() => navigate('/portal/contributions')}
                className="btn btn-link text-decoration-none btn-sm fw-semibold p-0"
              >
                View Full Breakdown <i className="bi bi-arrow-right"></i>
              </button>
            </div>

            <div className="card-body p-3">
              {campaigns.length === 0 ? (
                <div className="text-muted small py-3 text-center">
                  No active campaigns applicable at this time.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {campaigns.map((camp) => (
                    <div key={camp.campaign_id} className="p-3 bg-light rounded-3 border">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-bold text-dark">{camp.campaign_title}</div>
                          <div className="small text-muted">{camp.campaign_purpose}</div>
                        </div>
                        <span
                          className={`badge rounded-pill px-2.5 py-1 ${
                            camp.status === 'PAID'
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : 'bg-warning-subtle text-warning border border-warning-subtle'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>

                      <div className="row g-2 pt-2 border-top text-center small">
                        <div className="col-4">
                          <span className="text-muted d-block">Assessed:</span>
                          <strong className="text-dark">${camp.expected_amount.toFixed(2)}</strong>
                        </div>
                        <div className="col-4">
                          <span className="text-muted d-block">Paid:</span>
                          <strong className="text-success">${camp.verified_paid_amount.toFixed(2)}</strong>
                        </div>
                        <div className="col-4">
                          <span className="text-muted d-block">Remaining:</span>
                          <strong className="text-warning">${camp.remaining_balance.toFixed(2)}</strong>
                        </div>
                      </div>

                      {camp.payments.length > 0 && (
                        <div className="pt-2 mt-2 border-top d-flex align-items-center justify-content-between small text-muted">
                          <span>
                            Latest Payment: <code>{camp.payments[0].transaction_reference}</code>
                          </span>
                          {camp.payments[0].receipt_number && (
                            <button
                              onClick={async () => {
                                const rec = await api.getReceipt(camp.payments[0].receipt_number!);
                                setSelectedReceipt(rec);
                              }}
                              className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-receipt me-1"></i>
                              Receipt #{camp.payments[0].receipt_number}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Announcements Feed Card */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-bottom">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-megaphone-fill text-warning"></i>
                <span>Official Student Council Announcements</span>
              </h5>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">
                        {ann.category}
                      </span>
                      <span className="small text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                        {new Date(ann.published_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="fw-bold text-dark mt-1">{ann.title}</div>
                    <div className="small text-secondary mt-1">{ann.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Representatives */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-people-fill text-info"></i>
                <span>My Representatives</span>
              </h5>
              <button
                onClick={() => navigate('/portal/representatives')}
                className="btn btn-link text-decoration-none btn-sm fw-semibold p-0"
              >
                View All
              </button>
            </div>

            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {representatives.map((rep) => (
                  <div key={rep.id} className="p-3 bg-light rounded-3 border">
                    <div className="fw-bold text-dark">{rep.full_name}</div>
                    <div className="small text-primary fw-semibold">{rep.role_title}</div>
                    <div className="small text-muted mt-1">{rep.bio || 'Available for student advocacy'}</div>

                    {rep.office_hours && (
                      <div className="small text-secondary mt-1 d-flex align-items-center gap-1">
                        <i className="bi bi-clock"></i>
                        <span>{rep.office_hours}</span>
                      </div>
                    )}

                    <div className="d-flex flex-wrap gap-1 mt-2 pt-2 border-top">
                      {rep.contact_number && (
                        <a
                          href={`tel:${rep.contact_number}`}
                          className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-0.5"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <i className="bi bi-telephone-fill me-1"></i> Call
                        </a>
                      )}
                      {rep.email && (
                        <a
                          href={`mailto:${rep.email}`}
                          className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-0.5"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <i className="bi bi-envelope-fill me-1"></i> Email
                        </a>
                      )}
                      {rep.whatsapp_number && (
                        <a
                          href={`https://wa.me/${rep.whatsapp_number}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-success btn-sm rounded-pill px-2.5 py-0.5"
                          style={{ fontSize: '0.75rem' }}
                        >
                          <i className="bi bi-whatsapp me-1"></i> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Receipt Modal */}
      <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />

      {/* Student Feedback Modal */}
      <StudentFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmitted={() => {
          setNotificationMsg('Your concern was submitted to the representative council and recorded in the audit trail.');
          setTimeout(() => setNotificationMsg(null), 6000);
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setNotificationMsg('Your password was successfully updated.');
          setTimeout(() => setNotificationMsg(null), 6000);
        }}
      />
    </div>
  );
};
