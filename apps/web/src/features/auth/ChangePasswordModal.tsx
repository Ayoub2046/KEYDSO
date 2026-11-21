import React, { useState } from 'react';
import { api } from '../../services/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccessMessage('Password changed successfully! Keep your new password safe.');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header bg-dark text-white border-bottom border-secondary-subtle py-3 px-4" style={{ backgroundColor: '#090e17 !important' }}>
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-key-fill text-warning"></i>
              <span>Change Password</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {errorMessage && (
                <div className="alert alert-danger d-flex align-items-center rounded-3 p-3 mb-3 shadow-sm small">
                  <i className="bi bi-exclamation-triangle-fill fs-5 me-2 flex-shrink-0 text-danger"></i>
                  <div>{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success d-flex align-items-center rounded-3 p-3 mb-3 shadow-sm small">
                  <i className="bi bi-check-circle-fill fs-5 me-2 flex-shrink-0 text-success"></i>
                  <div>{successMessage}</div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                  Current Password (or Student ID)
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password or ID"
                    className="form-control bg-light border-start-0 ps-0"
                  />
                </div>
                <div className="form-text" style={{ fontSize: '0.75rem' }}>
                  Default password for new students is your Student ID (e.g. <code>cis231660</code>).
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                  New Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-shield-lock"></i>
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="form-control bg-light border-start-0 ps-0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                  Confirm New Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-shield-check"></i>
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="form-control bg-light border-start-0 ps-0"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light px-4 py-3 border-top d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-sm rounded-pill px-4 fw-semibold shadow-sm"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
