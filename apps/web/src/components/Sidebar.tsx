import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { RoleName } from '@keydso/shared-types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const navigate = useNavigate();

  const roles = user?.roles || [];
  const isAdmin = roles.includes(RoleName.SYSTEM_ADMIN);
  const isFinance = roles.includes(RoleName.FINANCE_OFFICER) || isAdmin;
  const isFacultyPres = roles.includes(RoleName.FACULTY_PRESIDENT);
  const isExecutive =
    roles.includes(RoleName.GENERAL_PRESIDENT) ||
    roles.includes(RoleName.VICE_PRESIDENT) ||
    isAdmin;
  const isSecretary = roles.includes(RoleName.SECRETARY);
  const isCommitteeMember =
    roles.includes(RoleName.COMMITTEE_CHAIR) || roles.includes(RoleName.COMMITTEE_MEMBER);
  const isCouncil = isExecutive || isFacultyPres || isSecretary || isCommitteeMember;
  const hasFinanceAccess = isFinance || isExecutive;
  const isStudentOnly = roles.length === 1 && roles.includes(RoleName.STUDENT);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `km-nav-link d-flex align-items-center gap-3 px-3 py-2 text-decoration-none fw-medium ${
      isActive ? 'active' : ''
    }`;

  const handleNavClick = () => {
    if (window.innerWidth < 992) {
      closeMobileSidebar();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <aside
        className={`sidebar-container d-flex flex-column flex-shrink-0 text-white sidebar-mobile ${
          mobileSidebarOpen ? 'mobile-open' : ''
        } ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
        style={{
          minHeight: 'calc(100vh - 60px)',
          backgroundColor: '#0B2545',
          borderRight: '1px solid rgba(198, 202, 203, 0.25)',
          zIndex: 1045,
        }}
      >
        {/* Brand Header with Shield Emblem from Screenshot */}
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-white border-opacity-10">
          {!sidebarCollapsed ? (
            <div className="d-flex align-items-center gap-2.5 overflow-hidden">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white flex-shrink-0 shadow-sm"
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#0F5F38',
                  border: '2px solid #25A8E0',
                }}
              >
                <i className="bi bi-shield-shaded fs-4 text-white"></i>
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-white lh-1 fs-6 tracking-wide text-truncate">
                  KEYDSO MAANTA
                </div>
                <div className="text-white-50 small text-truncate mt-1" style={{ fontSize: '0.65rem' }}>
                  University Student Representative Council
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <div
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#0F5F38',
                  border: '2px solid #25A8E0',
                }}
                title="KEYDSO MAANTA"
              >
                <i className="bi bi-shield-shaded fs-5 text-white"></i>
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="btn btn-sm btn-link text-white-50 hover-white p-1 d-none d-lg-flex align-items-center justify-content-center rounded-2"
            style={{ width: '28px', height: '28px', textDecoration: 'none' }}
          >
            <i className={`bi ${sidebarCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'} fs-6`}></i>
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={closeMobileSidebar}
            className="btn btn-sm btn-link text-white-50 hover-white p-1 d-lg-none"
            style={{ textDecoration: 'none' }}
          >
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="d-flex flex-column gap-3 flex-grow-1 overflow-y-auto px-2 py-3">
          {/* Main Dashboard Link */}
          <nav className="nav flex-column gap-1">
            <NavLink
              to="/dashboard"
              end
              className={navLinkClass}
              onClick={handleNavClick}
              title="Dashboard"
            >
              <i className="bi bi-grid-fill text-km-cyan fs-5"></i>
              <span className="nav-item-text">Dashboard</span>
            </NavLink>
          </nav>

          {/* Core Roles & Management */}
          <div>
            {!sidebarCollapsed && (
              <div
                className="nav-section-title text-uppercase text-white-50 fw-bold px-3 mb-1.5"
                style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}
              >
                {isAdmin ? 'Administration' : isCouncil ? 'Council Operations' : 'Student Portal'}
              </div>
            )}
            <nav className="nav flex-column gap-1">
              {isAdmin && (
                <>
                  <NavLink to="/admin/roles" className={navLinkClass} onClick={handleNavClick} title="Users & Roles">
                    <i className="bi bi-people-fill text-white-50 fs-5"></i>
                    <span className="nav-item-text">Users &amp; Roles</span>
                  </NavLink>

                  <NavLink to="/admin/academics" className={navLinkClass} onClick={handleNavClick} title="Faculties">
                    <i className="bi bi-building text-white-50 fs-5"></i>
                    <span className="nav-item-text">Faculties</span>
                  </NavLink>

                  <NavLink to="/admin/academics" className={navLinkClass} onClick={handleNavClick} title="Departments">
                    <i className="bi bi-diagram-2 text-white-50 fs-5"></i>
                    <span className="nav-item-text">Departments</span>
                  </NavLink>
                </>
              )}

              {/* Student Directory for all non-student roles */}
              {!isStudentOnly && (
                <NavLink to="/students" className={navLinkClass} onClick={handleNavClick} title="Students Directory">
                  <i className="bi bi-mortarboard text-white-50 fs-5"></i>
                  <span className="nav-item-text">Students</span>
                </NavLink>
              )}

              {/* Finance Navigation */}
              {hasFinanceAccess && (
                <>
                  <NavLink to="/finance/campaigns" className={navLinkClass} onClick={handleNavClick} title="Finance & Dues">
                    <i className="bi bi-cash-coin text-white-50 fs-5"></i>
                    <span className="nav-item-text">Finance</span>
                  </NavLink>

                  <NavLink to="/finance/payments/verify" className={navLinkClass} onClick={handleNavClick} title="Payment Queue">
                    <i className="bi bi-check2-circle text-white-50 fs-5"></i>
                    <span className="nav-item-text">Verification</span>
                  </NavLink>
                </>
              )}

              {/* Governance & Council */}
              {isCouncil && (
                <>
                  <NavLink to="/governance/faculty" className={navLinkClass} onClick={handleNavClick} title="Faculty Workspace">
                    <i className="bi bi-building-check text-white-50 fs-5"></i>
                    <span className="nav-item-text">Faculty Workspace</span>
                  </NavLink>

                  <NavLink to="/governance/meetings" className={navLinkClass} onClick={handleNavClick} title="Meetings & Training">
                    <i className="bi bi-calendar3 text-white-50 fs-5"></i>
                    <span className="nav-item-text">Meetings</span>
                  </NavLink>

                  <NavLink to="/governance/committees" className={navLinkClass} onClick={handleNavClick} title="Committees">
                    <i className="bi bi-diagram-3 text-white-50 fs-5"></i>
                    <span className="nav-item-text">Committees</span>
                  </NavLink>

                  <NavLink to="/governance/challenges" className={navLinkClass} onClick={handleNavClick} title="Challenges">
                    <i className="bi bi-exclamation-triangle text-white-50 fs-5"></i>
                    <span className="nav-item-text">Challenges</span>
                  </NavLink>
                </>
              )}

              {/* Student Portal Links */}
              <NavLink to="/portal" className={navLinkClass} onClick={handleNavClick} title="Student Portal">
                <i className="bi bi-person-vcard text-white-50 fs-5"></i>
                <span className="nav-item-text">Student Portal</span>
              </NavLink>

              <NavLink to="/portal/contributions" className={navLinkClass} onClick={handleNavClick} title="My Contributions">
                <i className="bi bi-receipt text-white-50 fs-5"></i>
                <span className="nav-item-text">Contributions</span>
              </NavLink>

              <NavLink to="/portal/transparency" className={navLinkClass} onClick={handleNavClick} title="Spending Transparency">
                <i className="bi bi-shield-check text-white-50 fs-5"></i>
                <span className="nav-item-text">Transparency</span>
              </NavLink>

              {/* Reports & Analytics */}
              <NavLink to="/reports" className={navLinkClass} onClick={handleNavClick} title="Reports & Analytics">
                <i className="bi bi-bar-chart-line text-white-50 fs-5"></i>
                <span className="nav-item-text">Reports</span>
              </NavLink>

              {/* Settings / Landing Page CMS */}
              {(isAdmin || roles.includes(RoleName.GENERAL_PRESIDENT)) && (
                <NavLink to="/admin/landing-settings" className={navLinkClass} onClick={handleNavClick} title="Settings & CMS">
                  <i className="bi bi-gear-fill text-white-50 fs-5"></i>
                  <span className="nav-item-text">Settings &amp; CMS</span>
                </NavLink>
              )}

              {/* Audit Logs */}
              {isAdmin && (
                <NavLink to="/admin/audit-logs" className={navLinkClass} onClick={handleNavClick} title="Audit Logs">
                  <i className="bi bi-clock-history text-white-50 fs-5"></i>
                  <span className="nav-item-text">Audit Logs</span>
                </NavLink>
              )}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer with Logout Button */}
        <div className="p-2.5 border-top border-white border-opacity-10 bg-black bg-opacity-20">
          <button
            onClick={handleLogout}
            className="btn btn-link text-white-50 hover-white w-100 d-flex align-items-center gap-2.5 px-2 py-1.5 text-decoration-none"
            style={{ fontSize: '0.85rem' }}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right text-danger fs-5"></i>
            {!sidebarCollapsed && <span className="text-white-50">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
