import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../store/uiStore';

export const Layout: React.FC = () => {
  const { mobileSidebarOpen, closeMobileSidebar } = useUIStore();

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#ECECEC' }}>
      <Navbar />

      <div className="d-flex flex-grow-1 position-relative overflow-hidden">
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            className="mobile-overlay d-lg-none"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}

        <Sidebar />

        <div
          className="d-flex flex-column flex-grow-1 overflow-y-auto"
          style={{
            maxHeight: 'calc(100vh - 62px)',
            backgroundColor: '#ECECEC',
          }}
        >
          <main className="flex-grow-1 p-3 p-md-4 p-xl-4">
            <Outlet />
          </main>

          {/* Institutional Trust Footer Banner matching screenshot */}
          <footer
            className="text-white py-2.5 px-3 px-md-4 mt-auto border-top border-white border-opacity-10 d-none d-md-block"
            style={{ backgroundColor: '#0B2545' }}
          >
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 text-center text-md-start">
              <div className="d-flex flex-wrap align-items-center gap-3 gap-lg-4 small text-white-50" style={{ fontSize: '0.74rem' }}>
                <span className="d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-shield-check text-km-cyan"></i>
                  <span>Secure &amp; Scalable</span>
                </span>
                <span className="d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-lock-fill text-km-cyan"></i>
                  <span>Role-Based Access Control</span>
                </span>
                <span className="d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-graph-up-arrow text-km-cyan"></i>
                  <span>Real-Time Analytics</span>
                </span>
                <span className="d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-file-earmark-text-fill text-km-cyan"></i>
                  <span>Transparent Finance</span>
                </span>
                <span className="d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-phone-fill text-km-cyan"></i>
                  <span>Responsive Design</span>
                </span>
              </div>

              <div className="d-flex align-items-center gap-2 ms-auto">
                <div
                  className="rounded-2 d-flex align-items-center justify-content-center text-white"
                  style={{ width: '22px', height: '22px', backgroundColor: '#0F5F38', fontSize: '0.75rem' }}
                >
                  <i className="bi bi-shield-shaded"></i>
                </div>
                <div>
                  <span className="fw-bold text-white small" style={{ fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                    KEYDSO MAANTA
                  </span>
                  <span className="text-white-50 ms-1.5 small fst-italic" style={{ fontSize: '0.68rem' }}>
                    Stronger Students. A Better University.
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
