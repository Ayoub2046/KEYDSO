import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { LandingPageSettings } from '@keydso/shared-types';

const CAMPUS_PRESETS = [
  {
    name: 'Zamzam University Science & Tech (Recommended)',
    url: '/zamzam_hero.jpg',
    desc: 'Official Zamzam campus with students & main building',
  },
  {
    name: 'Modern University Quad & Campus',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80',
    desc: 'Iconic university library and student quadrangle',
  },
  {
    name: 'Students Collaborating & Studying',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80',
    desc: 'Energetic campus study group in modern learning space',
  },
  {
    name: 'University Main Hall & Grounds',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80',
    desc: 'Prestigious academic architecture with campus lawns',
  },
  {
    name: 'Academic Library & Research Hall',
    url: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1920&q=80',
    desc: 'Deep focus study atrium with natural ambient lighting',
  },
];

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
  const [showBgModal, setShowBgModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'student' | 'council'>('student');

  // Background Customizer State
  const [bgInputUrl, setBgInputUrl] = useState('');
  const [bgOverlay, setBgOverlay] = useState(0.65);
  const [isSavingBg, setIsSavingBg] = useState(false);
  const [bgSuccessMsg, setBgSuccessMsg] = useState<string | null>(null);
  const [bgErrorMsg, setBgErrorMsg] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBgErrorMsg('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setBgErrorMsg('Image size exceeds 8MB. Please select a smaller photo or compress it.');
      return;
    }

    setBgErrorMsg(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setBgInputUrl(result);
        // Live update on landing page right away
        setSettings((prev) => ({
          ...prev,
          background_image_url: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBackground = async () => {
    setIsSavingBg(true);
    setBgSuccessMsg(null);
    setBgErrorMsg(null);

    const newUrl = bgInputUrl.trim() || '/zamzam_hero.jpg';

    try {
      const updatedPayload: LandingPageSettings = {
        ...settings,
        background_image_url: newUrl,
        background_overlay_opacity: bgOverlay,
      };

      const res = await api.updateLandingSettings(updatedPayload);
      setSettings(res);
      setBgSuccessMsg('Background image saved and published successfully!');
      setTimeout(() => {
        setShowBgModal(false);
      }, 1500);
    } catch (err: any) {
      // Even if API threw an error, update locally so the user sees it immediately
      setSettings((prev) => ({
        ...prev,
        background_image_url: newUrl,
        background_overlay_opacity: bgOverlay,
      }));
      setBgSuccessMsg('Background applied to current session!');
      setTimeout(() => {
        setShowBgModal(false);
      }, 1500);
    } finally {
      setIsSavingBg(false);
    }
  };

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
              {/* Change Background Quick Access Button */}
              <button
                type="button"
                onClick={() => {
                  setBgInputUrl(settings.background_image_url || '/zamzam_hero.jpg');
                  setBgOverlay(settings.background_overlay_opacity ?? 0.65);
                  setBgSuccessMsg(null);
                  setBgErrorMsg(null);
                  setUploadedFileName(null);
                  setShowBgModal(true);
                }}
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-semibold border d-flex align-items-center gap-1.5 text-white shadow-sm"
                style={{
                  backgroundColor: 'rgba(37, 168, 224, 0.25)',
                  borderColor: '#25A8E0',
                  fontSize: '0.82rem',
                }}
                title="Change Landing Page Background Image"
              >
                <i className="bi bi-image-fill text-km-cyan"></i>
                <span className="d-none d-sm-inline">Change Background</span>
                <span className="d-inline d-sm-none">Background</span>
              </button>

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

      {/* Background Image Customizer Modal */}
      {showBgModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(4, 15, 30, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '720px' }}>
            <div
              className="modal-content border-0 rounded-4 overflow-hidden shadow-2xl text-white"
              style={{
                backgroundColor: '#0B2545',
                border: '1px solid rgba(159, 187, 222, 0.25)',
              }}
            >
              {/* Modal Header */}
              <div
                className="modal-header border-bottom py-3 px-4 d-flex align-items-center justify-content-between"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(17, 118, 188, 0.15)' }}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-white"
                    style={{ width: '36px', height: '36px', backgroundColor: '#1176BC' }}
                  >
                    <i className="bi bi-image fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-white fs-6 mb-0">Change Landing Background Image</h5>
                    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>
                      Upload custom photo or select official university campus presets
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowBgModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 text-white">
                {bgSuccessMsg && (
                  <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 p-2.5 mb-3 small" role="alert">
                    <i className="bi bi-check-circle-fill text-success fs-5 flex-shrink-0"></i>
                    <div>{bgSuccessMsg}</div>
                  </div>
                )}

                {bgErrorMsg && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 p-2.5 mb-3 small" role="alert">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0"></i>
                    <div>{bgErrorMsg}</div>
                  </div>
                )}

                {/* 1. Upload from Computer */}
                <div className="p-3 mb-3 rounded-3 text-center border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileUpload}
                    className="d-none"
                  />
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{ width: '42px', height: '42px', backgroundColor: '#10B981' }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-bold small text-white">Upload New Background From Your Computer</div>
                      <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>
                        Supports JPG, PNG, WebP up to 8MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm rounded-pill px-4 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm text-white"
                      style={{ backgroundColor: '#10B981' }}
                    >
                      <i className="bi bi-folder2-open"></i>
                      <span>Choose Image File</span>
                    </button>
                    {uploadedFileName && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small mt-1">
                        <i className="bi bi-check-circle me-1"></i> Loaded: {uploadedFileName}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Campus Presets */}
                <div className="mb-3">
                  <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wider mb-2">
                    Or Select Campus Preset
                  </label>
                  <div className="row g-2">
                    {CAMPUS_PRESETS.map((p, idx) => {
                      const isSelected = bgInputUrl === p.url || (!bgInputUrl && idx === 0);
                      return (
                        <div key={idx} className="col-12 col-sm-6">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFileName(null);
                              setBgInputUrl(p.url);
                              setSettings((prev) => ({ ...prev, background_image_url: p.url }));
                            }}
                            className={`w-100 text-start p-2.5 rounded-3 border d-flex align-items-center gap-2.5 transition-all ${
                              isSelected
                                ? 'border-primary bg-primary bg-opacity-20 text-white'
                                : 'border-secondary-subtle border-opacity-25 bg-black bg-opacity-20 text-white-50 hover-white'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div
                              className="rounded-2 flex-shrink-0"
                              style={{
                                width: '48px',
                                height: '36px',
                                backgroundImage: `url('${p.url}')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: isSelected ? '1.5px solid #25A8E0' : '1px solid rgba(255,255,255,0.2)',
                              }}
                            />
                            <div className="overflow-hidden">
                              <div className="fw-semibold text-truncate small text-white" style={{ fontSize: '0.78rem' }}>
                                {p.name}
                              </div>
                              <div className="text-white-50 text-truncate" style={{ fontSize: '0.68rem' }}>
                                {p.desc}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Direct URL Input */}
                <div className="mb-3">
                  <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wider mb-1">
                    Or Custom Image Web URL
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark border-secondary-subtle border-opacity-30 border-end-0 text-km-cyan">
                      <i className="bi bi-link-45deg"></i>
                    </span>
                    <input
                      type="url"
                      value={bgInputUrl.startsWith('data:') ? '' : bgInputUrl}
                      onChange={(e) => {
                        const u = e.target.value;
                        setBgInputUrl(u);
                        if (u.trim().length > 5) {
                          setSettings((prev) => ({ ...prev, background_image_url: u }));
                        }
                      }}
                      placeholder="https://example.com/university-photo.jpg"
                      className="form-control form-control-glass-dark border-start-0 ps-0 text-white small"
                    />
                  </div>
                </div>

                {/* 4. Overlay Opacity Slider */}
                <div className="mb-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wider mb-0">
                      Background Darkness Overlay
                    </label>
                    <span className="font-monospace small text-km-cyan fw-bold">
                      {Math.round(bgOverlay * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={bgOverlay}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBgOverlay(val);
                      setSettings((prev) => ({ ...prev, background_overlay_opacity: val }));
                    }}
                    className="form-range"
                  />
                  <div className="d-flex justify-content-between text-white-50 small" style={{ fontSize: '0.68rem' }}>
                    <span>Brighter photo (20%)</span>
                    <span>Darker for maximum readability (95%)</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                className="modal-footer border-top py-2.5 px-4 d-flex align-items-center justify-content-between"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setBgInputUrl('/zamzam_hero.jpg');
                    setBgOverlay(0.65);
                    setSettings((prev) => ({
                      ...prev,
                      background_image_url: '/zamzam_hero.jpg',
                      background_overlay_opacity: 0.65,
                    }));
                  }}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-white-50"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Reset to Zamzam
                </button>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBgModal(false)}
                    className="btn btn-sm btn-outline-light rounded-pill px-3"
                    style={{ fontSize: '0.82rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingBg}
                    onClick={handleSaveBackground}
                    className="btn btn-sm rounded-pill px-4 fw-bold text-white shadow-sm d-flex align-items-center gap-1.5"
                    style={{ backgroundColor: '#1176BC', borderColor: '#1176BC', fontSize: '0.85rem' }}
                  >
                    {isSavingBg ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle"></i>
                        <span>Save &amp; Apply Background</span>
                      </>
                    )}
                  </button>
                </div>
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
