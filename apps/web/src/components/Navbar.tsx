import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from './NotificationCenter';
import { ChangePasswordModal } from '../features/auth/ChangePasswordModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { toggleMobileSidebar, toggleSidebar, sidebarCollapsed } = useUIStore();
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <header
        className="navbar navbar-expand sticky-top px-3 px-lg-4 border-bottom shadow-sm"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#C6CACB',
          minHeight: '62px',
          zIndex: 1030,
        }}
      >
        <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
          {/* Left: Toggles & Search Bar */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-lg-none border-0 p-1.5 text-dark"
              onClick={toggleMobileSidebar}
              aria-label="Toggle navigation menu"
            >
              <i className="bi bi-list fs-4 text-dark"></i>
            </button>

            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              className="btn btn-sm btn-light text-muted d-none d-lg-flex align-items-center justify-content-center p-1 rounded-2 border"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{ width: '32px', height: '32px' }}
            >
              <i className={`bi ${sidebarCollapsed ? 'bi-text-indent-left' : 'bi-text-indent-right'} fs-5 text-dark`}></i>
            </button>

            {/* Search Input matching screenshot */}
            <div className="position-relative d-none d-sm-block" style={{ width: '260px' }}>
              <i
                className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted"
                style={{ fontSize: '0.85rem' }}
              ></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="form-control form-control-sm ps-4 bg-light rounded-pill border-0 text-dark small"
                style={{ backgroundColor: '#ECECEC !important', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Right: Date, Notifications, User Avatar & Menu */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            {/* Date / Semester Badge from screenshot */}
            <div className="d-none d-md-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-light border small text-muted">
              <i className="bi bi-calendar3 text-km-cyan"></i>
              <span style={{ fontSize: '0.75rem', fontWeight: 550 }}>Spring 2025</span>
              <span className="text-secondary" style={{ fontSize: '0.7rem' }}>• {todayFormatted}</span>
            </div>

            {user && (
              <>
                <NotificationCenter />

                {/* User Profile Pill matching screenshot */}
                <div
                  className="d-flex align-items-center gap-2 ps-2 pe-1 py-1 rounded-pill hover-bg-light cursor-pointer"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setShowPasswordModal(true)}
                  title="Click to manage profile / change password"
                >
                  <div
                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '0.88rem',
                      background: 'linear-gradient(135deg, #1176BC 0%, #25A8E0 100%)',
                    }}
                  >
                    {user.full_name?.charAt(0) || 'A'}
                  </div>

                  <div className="text-start d-none d-sm-block">
                    <div className="text-dark small fw-bold lh-1 text-truncate" style={{ maxWidth: '140px', fontSize: '0.82rem' }}>
                      {user.full_name}
                    </div>
                    <div className="text-muted small mt-0.5 text-truncate" style={{ maxWidth: '140px', fontSize: '0.68rem' }}>
                      {user.roles?.[0]?.replace('_', ' ') || 'Student'}
                    </div>
                  </div>
                </div>

                {/* Logout Action Pill */}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-1 d-flex align-items-center gap-1 border-opacity-50"
                  style={{ fontSize: '0.78rem' }}
                >
                  <i className="bi bi-box-arrow-right text-danger"></i>
                  <span className="d-none d-lg-inline">Sign Out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
};
