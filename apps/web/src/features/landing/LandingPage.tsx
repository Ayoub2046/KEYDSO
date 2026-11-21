import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { LandingPageSettings } from '@keydso/shared-types';

const DEFAULT_SETTINGS: LandingPageSettings = {
  hero_title: 'Keydso Maanta Every Contribution Matters. Every Action Is Accountable.',
  hero_subtitle: 'A modern platform to manages student contributions, representatives, activities and university affairs with full transparency and trust.',
  badge_text: 'University Student Representative Council',
  background_image_url: '/zamzam_hero.jpg',
  background_overlay_opacity: 0.65,
  stat_students_count: '8,450',
  stat_treasury_amount: '8',
  stat_audit_rate: '100%',
  feature_1_title: 'Cryptographic Receipts',
  feature_1_desc: 'Every semester payment generates an HMAC-SHA256 verified digital receipt with an immutable verification code.',
  feature_2_title: 'Public Spending Feed',
  feature_2_desc: 'Council disbursements exceeding $500 require dual executive approval and are immediately published with attached invoices.',
  feature_3_title: 'Direct Student Advocacy',
  feature_3_desc: 'Submit academic or welfare grievances straight to your faculty representative with transparent status tracking.',
  announcement_banner: 'University Student Representative Council',
};

export const LandingPage: React.FC = () => {
  // Empty states — no hardcoded outfill / demo fills
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<LandingPageSettings>(DEFAULT_SETTINGS);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'student' | 'council'>('student');

  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getLandingSettings();
        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
          });
        }
      } catch (err) {
        // Fallback default
      }
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const session = await api.login({ email: loginIdentifier, password: loginPassword });
      setSession(session.access_token, {
        ...session.user,
        roles: session.roles,
        assigned_faculty_id: session.assigned_faculty_id,
      });

      setShowLoginModal(false);
      if (session.roles?.includes('STUDENT') && session.roles.length === 1) {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const overlayOpacity = settings.background_overlay_opacity ?? 0.65;

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark position-relative overflow-x-hidden">
      {/* 1. Full-Bleed Background Image (Exact Zamzam University Photo or Admin Upload) */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: `url('${settings.background_image_url || '/zamzam_hero.jpg'}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }}
      />

      {/* 2. Gradient Overlay from screenshot: Deep on left for text contrast, transparent on right for students & building */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          background: `linear-gradient(to right, rgba(4, 15, 30, ${overlayOpacity + 0.28}) 0%, rgba(4, 15, 30, ${overlayOpacity + 0.15}) 40%, rgba(4, 15, 30, ${overlayOpacity - 0.25}) 70%, rgba(4, 15, 30, 0.1) 100%)`,
          zIndex: 1,
        }}
      />

      {/* 3. Main Content Container */}
      <div className="position-relative d-flex flex-column min-vh-100 text-white" style={{ zIndex: 2 }}>
        {/* Top Navbar matching screenshot */}
        <nav
          className="navbar navbar-expand-lg navbar-dark py-3 px-3 px-lg-5"
          style={{
            backgroundColor: 'rgba(4, 15, 30, 0.45)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
            {/* Left Brand: Shield with Book in Green matching screenshot */}
            <Link to="/" className="d-flex align-items-center gap-2.5 text-decoration-none">
              <div
                className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: '#0F5F38',
                  border: '2px solid #10B981',
                }}
              >
                <i className="bi bi-shield-shaded fs-4 text-white"></i>
              </div>
              <div>
                <div className="fw-bold text-white lh-1 fs-6 tracking-wide">KEYDSO MAANTA</div>
                <div className="text-white-50 small mt-0.5" style={{ fontSize: '0.68rem' }}>
                  University Student Council
                </div>
              </div>
            </Link>

            {/* Center Navigation Links matching screenshot */}
            <div className="d-none d-lg-flex align-items-center gap-4">
              <Link
                to="/"
                className="badge text-white px-3 py-1.5 rounded-pill text-decoration-none fw-semibold"
                style={{ backgroundColor: '#059669', fontSize: '0.85rem' }}
              >
                Home
              </Link>
              <a href="#about" className="text-white-50 hover-white text-decoration-none small fw-medium">
                About
              </a>
              <div className="dropdown">
                <a
                  href="#features"
                  className="text-white-50 hover-white text-decoration-none small fw-medium d-flex align-items-center gap-1"
                >
                  <span>Features</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
                </a>
              </div>
              <div className="dropdown">
                <a
                  href="#dashboards"
                  className="text-white-50 hover-white text-decoration-none small fw-medium d-flex align-items-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    if (user) navigate('/dashboard');
                    else setShowLoginModal(true);
                  }}
                >
                  <span>Dashboard</span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
                </a>
              </div>
              <Link to="/portal/transparency" className="text-white-50 hover-white text-decoration-none small fw-medium">
                Reports
              </Link>
              <a href="#contact" className="text-white-50 hover-white text-decoration-none small fw-medium">
                Contact
              </a>
            </div>

            {/* Right: Search, Login & Register Buttons matching screenshot */}
            <div className="d-flex align-items-center gap-2 gap-sm-3">
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="btn btn-link text-white-50 hover-white p-1 d-none d-sm-inline"
                style={{ textDecoration: 'none' }}
                title="Search"
              >
                <i className="bi bi-search fs-5"></i>
              </button>

              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 text-white shadow-sm"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>Go to Dashboard</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setLoginTab('student');
                      setShowLoginModal(true);
                    }}
                    className="btn btn-sm text-white rounded-pill px-3.5 py-1.5 fw-semibold border"
                    style={{
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      fontSize: '0.85rem',
                    }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setLoginTab('student');
                      setShowLoginModal(true);
                    }}
                    className="btn btn-sm text-white rounded-pill px-3.5 py-1.5 fw-semibold shadow-sm"
                    style={{ backgroundColor: '#10B981', fontSize: '0.85rem' }}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Body matching screenshot */}
        <div className="container-fluid px-4 px-lg-5 my-auto py-5">
          <div className="row align-items-center">
            <div className="col-12 col-lg-7 col-xl-6 py-4">
              {/* Green Megaphone Announcement Pill matching screenshot */}
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-1.5 mb-3 rounded-pill text-white fw-semibold small shadow-sm"
                style={{
                  backgroundColor: '#059669',
                  fontSize: '0.82rem',
                }}
              >
                <i className="bi bi-megaphone-fill"></i>
                <span>{settings.badge_text || 'University Student Representative Council'}</span>
              </div>

              {/* Massive Main Headline with green accent matching screenshot */}
              <h1 className="display-4 fw-bold lh-sm mb-3 text-white" style={{ letterSpacing: '-0.02em' }}>
                Keydso Maanta <br />
                Every Contribution Matters. <br />
                Every Action Is <span style={{ color: '#10B981' }}>Accountable.</span>
              </h1>

              {/* Subtitle description matching screenshot */}
              <p
                className="lead text-white-50 mb-4"
                style={{ maxWidth: '580px', fontSize: '1.05rem', lineHeight: '1.6' }}
              >
                {settings.hero_subtitle}
              </p>

              {/* Action Buttons: Get Started & Watch Demo matching screenshot */}
              <div className="d-flex flex-wrap align-items-center gap-3 mb-5">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="btn btn-lg rounded-pill px-4 py-2.5 text-white fw-semibold d-flex align-items-center gap-2 shadow-lg"
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontSize: '1rem' }}
                >
                  <span>&rarr; Get Started</span>
                </button>

                <button
                  onClick={() => setShowDemoModal(true)}
                  className="btn btn-lg text-white rounded-pill px-4 py-2.5 fw-semibold d-flex align-items-center gap-2.5 border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.35)',
                    fontSize: '1rem',
                  }}
                >
                  <i className="bi bi-play-circle fs-5"></i>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* 4 Bottom Metric Stats matching screenshot */}
              <div className="d-flex flex-wrap align-items-center gap-4 gap-md-5 pt-3 border-top border-white border-opacity-10">
                {/* Stat 1: Students */}
                <div className="d-flex align-items-center gap-2.5">
                  <div className="fs-3 text-km-cyan">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div>
                    <div className="fs-5 fw-bold text-white lh-1">{settings.stat_students_count || '8,450'}</div>
                    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>Students</div>
                  </div>
                </div>

                {/* Stat 2: Faculties */}
                <div className="d-flex align-items-center gap-2.5">
                  <div className="fs-3 text-km-cyan">
                    <i className="bi bi-bank"></i>
                  </div>
                  <div>
                    <div className="fs-5 fw-bold text-white lh-1">{settings.stat_treasury_amount || '8'}</div>
                    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>Faculties</div>
                  </div>
                </div>

                {/* Stat 3: Committees */}
                <div className="d-flex align-items-center gap-2.5">
                  <div className="fs-3 text-km-cyan">
                    <i className="bi bi-diagram-3-fill"></i>
                  </div>
                  <div>
                    <div className="fs-5 fw-bold text-white lh-1">24</div>
                    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>Committees</div>
                  </div>
                </div>

                {/* Stat 4: Transparency */}
                <div className="d-flex align-items-center gap-2.5">
                  <div className="fs-3 text-success">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div>
                    <div className="fs-5 fw-bold text-success lh-1">{settings.stat_audit_rate || '100%'}</div>
                    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>Transparency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal with Clean Clean Inputs (No Outfill) */}
      {showLoginModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(4, 15, 30, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div
              className="modal-content border-0 rounded-4 overflow-hidden shadow-2xl text-white"
              style={{
                backgroundColor: '#0B2545',
                border: '1px solid rgba(159, 187, 222, 0.25)',
              }}
            >
              {/* Header */}
              <div className="modal-header border-bottom border-white border-opacity-10 py-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-2 d-flex align-items-center justify-content-center text-white"
                    style={{ width: '28px', height: '28px', backgroundColor: '#0F5F38' }}
                  >
                    <i className="bi bi-shield-shaded"></i>
                  </div>
                  <h5 className="modal-title fw-bold text-white fs-6 mb-0">KEYDSO MAANTA PORTAL</h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLoginModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Login Tabs: Student vs Staff */}
              <div className="p-4 pt-3">
                <div className="d-flex p-1 rounded-pill bg-dark bg-opacity-40 mb-3 border border-white border-opacity-10">
                  <button
                    type="button"
                    onClick={() => setLoginTab('student')}
                    className={`btn btn-sm rounded-pill flex-fill fw-semibold ${
                      loginTab === 'student' ? 'btn-success text-white shadow-sm' : 'text-white-50'
                    }`}
                    style={{ backgroundColor: loginTab === 'student' ? '#10B981' : 'transparent', fontSize: '0.82rem' }}
                  >
                    Student Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginTab('council')}
                    className={`btn btn-sm rounded-pill flex-fill fw-semibold ${
                      loginTab === 'council' ? 'btn-primary text-white shadow-sm' : 'text-white-50'
                    }`}
                    style={{ backgroundColor: loginTab === 'council' ? '#1176BC' : 'transparent', fontSize: '0.82rem' }}
                  >
                    Council &amp; Staff
                  </button>
                </div>

                {errorMessage && (
                  <div className="alert alert-danger d-flex align-items-center rounded-3 p-2.5 mb-3 small" role="alert">
                    <i className="bi bi-exclamation-triangle-fill fs-5 me-2 flex-shrink-0 text-danger"></i>
                    <div>{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  {/* Identifier Field — Empty, Clean Input */}
                  <div className="mb-3">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wider">
                      {loginTab === 'student' ? 'Student ID Number' : 'Council Email Address'}
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark border-secondary-subtle border-opacity-30 border-end-0 text-km-cyan">
                        <i className={`bi ${loginTab === 'student' ? 'bi-person-vcard' : 'bi-envelope'}`}></i>
                      </span>
                      <input
                        type={loginTab === 'student' ? 'text' : 'email'}
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder={loginTab === 'student' ? 'e.g. cis231660' : 'e.g. admin@keydso.university.edu'}
                        className="form-control form-control-glass-dark border-start-0 ps-0 font-monospace"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Password Field — Empty, Clean Input */}
                  <div className="mb-3">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wider">
                      Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-dark border-secondary-subtle border-opacity-30 border-end-0 text-km-cyan">
                        <i className="bi bi-key"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="form-control form-control-glass-dark border-start-0 border-end-0 ps-0"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="input-group-text bg-dark border-secondary-subtle border-opacity-30 border-start-0 text-white-50"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        style={{ cursor: 'pointer' }}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    {loginTab === 'student' && (
                      <div className="form-text text-white-50 mt-1 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                        <i className="bi bi-info-circle-fill text-success"></i>
                        <span>Default password is your Student ID. You can change it after login.</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn w-100 rounded-pill py-2.5 fw-bold text-white shadow-sm mt-3 d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: loginTab === 'student' ? '#10B981' : '#1176BC' }}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right"></i>
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Information Modal */}
      {showDemoModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(4, 15, 30, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '520px' }}>
            <div
              className="modal-content border-0 rounded-4 overflow-hidden shadow-2xl text-white"
              style={{
                backgroundColor: '#0B2545',
                border: '1px solid rgba(159, 187, 222, 0.25)',
              }}
            >
              <div className="modal-header border-bottom border-white border-opacity-10 py-3 px-4">
                <h5 className="modal-title fw-bold text-white fs-6 mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-play-circle text-success fs-5"></i>
                  <span>Keydso Maanta System Overview</span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowDemoModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body p-4 text-white-50 small">
                <p className="text-white">
                  Keydso Maanta is Zamzam University's official Student Representative Council digital infrastructure.
                </p>
                <div className="d-flex flex-column gap-2 mb-3">
                  <div className="p-2.5 rounded-3 bg-dark bg-opacity-40 border border-white border-opacity-10">
                    <strong className="text-white d-block mb-1">Verifiable Semester Dues</strong>
                    HMAC-SHA256 encrypted digital receipts generated for every semester contribution.
                  </div>
                  <div className="p-2.5 rounded-3 bg-dark bg-opacity-40 border border-white border-opacity-10">
                    <strong className="text-white d-block mb-1">Spending Transparency</strong>
                    100% of council expenditures exceeding $500 published publicly with receipts.
                  </div>
                  <div className="p-2.5 rounded-3 bg-dark bg-opacity-40 border border-white border-opacity-10">
                    <strong className="text-white d-block mb-1">Direct Student Representation</strong>
                    Direct communication with your elected faculty representatives.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    setShowLoginModal(true);
                  }}
                  className="btn btn-primary w-100 rounded-pill py-2 text-white fw-bold shadow-sm"
                  style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                >
                  Access Student Portal Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
