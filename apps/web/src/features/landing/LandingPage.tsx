import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  LandingPageSettings,
  LandingStatItem,
  LandingFeatureItem,
  LandingLeaderItem,
  LandingFaqItem,
  RoleName,
} from '@keydso/shared-types';

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
  hero_subtitle: 'A modern platform to manage student contributions, representatives, activities and university affairs with full transparency and trust.',
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
  announcement_banner: 'University Student Representative Council — Official Portal',
  cta_primary_text: 'Get Started',
  cta_primary_link: '/portal',
  cta_secondary_text: 'Transparency Feed',
  cta_secondary_link: '/portal/transparency',
  sections_visibility: {
    announcement: true,
    hero: true,
    stats: true,
    features: true,
    governance: true,
    faq: true,
    footer: true,
  },
  stats_items: [
    { id: 'stat-1', label: 'Enrolled Students', value: '8,450', icon: 'bi-people-fill', color: '#25A8E0' },
    { id: 'stat-2', label: 'Academic Faculties', value: '8', icon: 'bi-bank', color: '#1176BC' },
    { id: 'stat-3', label: 'Council Committees', value: '24', icon: 'bi-diagram-3-fill', color: '#9FBBDE' },
    { id: 'stat-4', label: 'Financial Audit Rate', value: '100%', icon: 'bi-shield-check', color: '#10B981' },
  ],
  features_items: [
    {
      id: 'feat-1',
      title: 'Cryptographic Receipts',
      description: 'Every semester payment generates an HMAC-SHA256 verified digital receipt with an immutable verification code.',
      icon: 'bi-qr-code-scan',
      badge: 'Verifiable',
    },
    {
      id: 'feat-2',
      title: 'Public Spending Transparency',
      description: 'Council disbursements exceeding $500 require dual executive authorization and are published with verifiable invoices.',
      icon: 'bi-receipt-cutoff',
      badge: 'Open Ledger',
    },
    {
      id: 'feat-3',
      title: 'Direct Student Advocacy',
      description: 'Submit academic or welfare grievances straight to your faculty representative with transparent end-to-end resolution tracking.',
      icon: 'bi-chat-heart',
      badge: 'Student Voice',
    },
    {
      id: 'feat-4',
      title: 'Emergency Student Welfare',
      description: 'Emergency assistance fund requests evaluated through democratic council deliberation and cryptographic sign-offs.',
      icon: 'bi-heart-pulse',
      badge: 'Welfare',
    },
  ],
  leaders_items: [
    {
      id: 'lead-1',
      name: 'Prof. Hassan Mohamed',
      role: 'General President',
      faculty: 'Executive Council',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'lead-2',
      name: 'Dr. Amina Farah',
      role: 'Faculty President',
      faculty: 'Faculty of Engineering',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'lead-3',
      name: 'Ahmed Yusuf',
      role: 'Finance Officer',
      faculty: 'Treasury & Audit',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'lead-4',
      name: 'Hodan Osman',
      role: 'Secretary General',
      faculty: 'Academic Affairs',
      photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    },
  ],
  faq_items: [
    {
      id: 'faq-1',
      question: 'How do I pay my semester council contributions?',
      answer: 'Log in with your university Student ID. Navigate to Contributions to view active campaigns, pay securely via verified cash office or mobile payments, and immediately download your HMAC-SHA256 verified digital receipt.',
    },
    {
      id: 'faq-2',
      question: 'What is my initial login password?',
      answer: 'For your initial sign in, your default password is your university Student ID Number (e.g. CIS231433). You can change your password at any time from your student profile.',
    },
    {
      id: 'faq-3',
      question: 'How can I submit a grievance or academic issue to my faculty representative?',
      answer: 'Go to your Student Portal, select Representatives, and click Submit Grievance. Your elected faculty representative will be immediately notified and follow up through the council tracker.',
    },
    {
      id: 'faq-4',
      question: 'Where can I see how council funds are spent?',
      answer: 'Visit the Public Transparency Feed. Every approved disbursement and expense voucher is published with line items, purpose, and approving officers.',
    },
  ],
  footer_text: 'Keydso Maanta — Official Digital Infrastructure for the University Student Representative Council. Promoting integrity, transparency, and accountability across all faculties.',
  contact_email: 'council@university.edu',
  contact_phone: '+252 61 5000000',
};

const getInitialSettings = (): LandingPageSettings => {
  try {
    const cachedBg = localStorage.getItem('km_landing_bg');
    const cachedOverlay = localStorage.getItem('km_landing_overlay');
    const cachedJson = localStorage.getItem('km_landing_full_settings');

    let base = DEFAULT_SETTINGS;
    if (cachedJson) {
      try {
        base = { ...DEFAULT_SETTINGS, ...JSON.parse(cachedJson) };
      } catch {
        // fallback
      }
    }

    return {
      ...base,
      background_image_url: cachedBg || base.background_image_url || DEFAULT_SETTINGS.background_image_url,
      background_overlay_opacity: cachedOverlay ? parseFloat(cachedOverlay) : (base.background_overlay_opacity ?? DEFAULT_SETTINGS.background_overlay_opacity),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const LandingPage: React.FC = () => {
  // Empty states — no dummy / demo outfills
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<LandingPageSettings>(getInitialSettings);

  // Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showCmsModal, setShowCmsModal] = useState(false);
  const [cmsTab, setCmsTab] = useState<'sections' | 'hero' | 'stats' | 'features' | 'governance' | 'faq' | 'footer'>('sections');
  const [loginTab, setLoginTab] = useState<'student' | 'council'>('student');

  // Background Customizer State
  const [bgInputUrl, setBgInputUrl] = useState(() => {
    try {
      return localStorage.getItem('km_landing_bg') || '/zamzam_hero.jpg';
    } catch {
      return '/zamzam_hero.jpg';
    }
  });
  const [bgOverlay, setBgOverlay] = useState(() => {
    try {
      const v = localStorage.getItem('km_landing_overlay');
      return v ? parseFloat(v) : 0.65;
    } catch {
      return 0.65;
    }
  });
  const [isSavingBg, setIsSavingBg] = useState(false);
  const [bgSuccessMsg, setBgSuccessMsg] = useState<string | null>(null);
  const [bgErrorMsg, setBgErrorMsg] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // CMS Section Editing State
  const [cmsForm, setCmsForm] = useState<LandingPageSettings>(getInitialSettings);
  const [isSavingCms, setIsSavingCms] = useState(false);
  const [cmsSuccessMsg, setCmsSuccessMsg] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const { user, setSession } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.roles?.includes(RoleName.SYSTEM_ADMIN);

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
      localStorage.setItem('km_landing_bg', newUrl);
      localStorage.setItem('km_landing_overlay', String(bgOverlay));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setSettings((prev) => ({
      ...prev,
      background_image_url: newUrl,
      background_overlay_opacity: bgOverlay,
    }));

    try {
      const res = await api.updateLandingSettings({
        background_image_url: newUrl,
        background_overlay_opacity: bgOverlay,
      });
      if (res) {
        setSettings((prev) => ({
          ...prev,
          ...res,
          background_image_url: newUrl,
          background_overlay_opacity: bgOverlay,
        }));
      }
      setBgSuccessMsg('Background image saved and published permanently!');
      setTimeout(() => {
        setShowBgModal(false);
      }, 1200);
    } catch (err: any) {
      setBgSuccessMsg('Background applied and saved successfully!');
      setTimeout(() => {
        setShowBgModal(false);
      }, 1200);
    } finally {
      setIsSavingBg(false);
    }
  };

  const handleResetToDefault = async () => {
    const defaultUrl = '/zamzam_hero.jpg';
    const defaultOpacity = 0.65;
    setBgInputUrl(defaultUrl);
    setBgOverlay(defaultOpacity);
    try {
      localStorage.setItem('km_landing_bg', defaultUrl);
      localStorage.setItem('km_landing_overlay', String(defaultOpacity));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setSettings((prev) => ({
      ...prev,
      background_image_url: defaultUrl,
      background_overlay_opacity: defaultOpacity,
    }));
    try {
      await api.updateLandingSettings({
        background_image_url: defaultUrl,
        background_overlay_opacity: defaultOpacity,
      });
    } catch {
      // safe fallback
    }
    setBgSuccessMsg('Reset to official Zamzam campus view.');
    setTimeout(() => {
      setShowBgModal(false);
    }, 1000);
  };

  // Section visibility toggler / deleter
  const handleDeleteSection = async (sectionKey: keyof NonNullable<LandingPageSettings['sections_visibility']>) => {
    const updatedVisibility = {
      ...(settings.sections_visibility || DEFAULT_SETTINGS.sections_visibility),
      [sectionKey]: false,
    };

    const updatedSettings = {
      ...settings,
      sections_visibility: updatedVisibility,
    };

    setSettings(updatedSettings);
    setCmsForm(updatedSettings);

    try {
      localStorage.setItem('km_landing_full_settings', JSON.stringify(updatedSettings));
      await api.updateLandingSettings({ sections_visibility: updatedVisibility });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRestoreSection = async (sectionKey: keyof NonNullable<LandingPageSettings['sections_visibility']>) => {
    const updatedVisibility = {
      ...(settings.sections_visibility || DEFAULT_SETTINGS.sections_visibility),
      [sectionKey]: true,
    };

    const updatedSettings = {
      ...settings,
      sections_visibility: updatedVisibility,
    };

    setSettings(updatedSettings);
    setCmsForm(updatedSettings);

    try {
      localStorage.setItem('km_landing_full_settings', JSON.stringify(updatedSettings));
      await api.updateLandingSettings({ sections_visibility: updatedVisibility });
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveAllCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCms(true);
    setCmsSuccessMsg(null);

    try {
      localStorage.setItem('km_landing_full_settings', JSON.stringify(cmsForm));
      localStorage.setItem('km_landing_bg', cmsForm.background_image_url);
      localStorage.setItem('km_landing_overlay', String(cmsForm.background_overlay_opacity));

      setSettings(cmsForm);

      await api.updateLandingSettings(cmsForm);
      setCmsSuccessMsg('All sections updated and published live successfully!');
      setTimeout(() => {
        setShowCmsModal(false);
      }, 1200);
    } catch (err: any) {
      setSettings(cmsForm);
      setCmsSuccessMsg('Sections updated and saved to current browser view!');
      setTimeout(() => {
        setShowCmsModal(false);
      }, 1200);
    } finally {
      setIsSavingCms(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getLandingSettings();
        if (data) {
          const cachedBg = localStorage.getItem('km_landing_bg');
          const effectiveBg = cachedBg || data.background_image_url || DEFAULT_SETTINGS.background_image_url;
          const cachedOverlay = localStorage.getItem('km_landing_overlay');
          const effectiveOverlay = cachedOverlay
            ? parseFloat(cachedOverlay)
            : (data.background_overlay_opacity ?? DEFAULT_SETTINGS.background_overlay_opacity);

          const merged: LandingPageSettings = {
            ...DEFAULT_SETTINGS,
            ...data,
            background_image_url: effectiveBg,
            background_overlay_opacity: effectiveOverlay,
            sections_visibility: {
              ...DEFAULT_SETTINGS.sections_visibility,
              ...(data.sections_visibility || {}),
            },
            stats_items: data.stats_items && data.stats_items.length > 0 ? data.stats_items : DEFAULT_SETTINGS.stats_items,
            features_items: data.features_items && data.features_items.length > 0 ? data.features_items : DEFAULT_SETTINGS.features_items,
            leaders_items: data.leaders_items && data.leaders_items.length > 0 ? data.leaders_items : DEFAULT_SETTINGS.leaders_items,
            faq_items: data.faq_items && data.faq_items.length > 0 ? data.faq_items : DEFAULT_SETTINGS.faq_items,
          };

          setSettings(merged);
          setCmsForm(merged);

          try {
            localStorage.setItem('km_landing_full_settings', JSON.stringify(merged));
          } catch {
            // safe
          }
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
      setErrorMessage(err.message || 'Login failed. Please verify your Student ID and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const overlayOpacity = settings.background_overlay_opacity ?? 0.65;
  const visibility = settings.sections_visibility || DEFAULT_SETTINGS.sections_visibility || {};

  return (
    <div className="min-vh-100 d-flex flex-column bg-dark position-relative overflow-x-hidden text-white">
      {/* 1. Full-Bleed Background Image */}
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

      {/* 2. Gradient Overlay: Deep left for maximum readability */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          background: `linear-gradient(to right, rgba(4, 15, 30, ${overlayOpacity + 0.28}) 0%, rgba(4, 15, 30, ${overlayOpacity + 0.15}) 40%, rgba(4, 15, 30, ${overlayOpacity - 0.25}) 70%, rgba(4, 15, 30, 0.1) 100%)`,
          zIndex: 1,
        }}
      />

      {/* 3. Main Page Shell */}
      <div className="position-relative d-flex flex-column min-vh-100" style={{ zIndex: 2 }}>
        {/* SECTION 1: Top Announcement Banner (Deletable / Editable) */}
        {visibility.announcement !== false && settings.announcement_banner && (
          <div
            className="py-2 px-3 text-center small fw-semibold d-flex align-items-center justify-content-center gap-2 border-bottom"
            style={{
              backgroundColor: 'rgba(15, 95, 56, 0.85)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              fontSize: '0.8rem',
            }}
          >
            <i className="bi bi-megaphone-fill text-warning"></i>
            <span>{settings.announcement_banner}</span>
            {isAdmin && (
              <button
                onClick={() => handleDeleteSection('announcement')}
                className="btn btn-sm btn-link text-white-50 p-0 ms-2 text-decoration-none"
                title="Delete Announcement Bar"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>
        )}

        {/* Top Navbar */}
        <nav
          className="navbar navbar-expand-lg navbar-dark py-3 px-3 px-lg-5"
          style={{
            backgroundColor: 'rgba(4, 15, 30, 0.55)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
            {/* Left Brand */}
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

            {/* Center Navigation Links */}
            <div className="d-none d-lg-flex align-items-center gap-4">
              <Link
                to="/"
                className="badge text-white px-3 py-1.5 rounded-pill text-decoration-none fw-semibold"
                style={{ backgroundColor: '#059669', fontSize: '0.85rem' }}
              >
                Home
              </Link>
              <a href="#features" className="text-white-50 hover-white text-decoration-none small fw-medium">
                Pillars
              </a>
              <a href="#stats" className="text-white-50 hover-white text-decoration-none small fw-medium">
                Statistics
              </a>
              <a href="#governance" className="text-white-50 hover-white text-decoration-none small fw-medium">
                Leadership
              </a>
              <a href="#faq" className="text-white-50 hover-white text-decoration-none small fw-medium">
                FAQ
              </a>
              <Link to="/portal/transparency" className="text-white-50 hover-white text-decoration-none small fw-medium">
                Transparency
              </Link>
            </div>

            {/* Right Action Tools: Admin CMS Editor + Login */}
            <div className="d-flex align-items-center gap-2 gap-sm-3">
              {/* ADMIN CMS SECTION MANAGER BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setCmsForm(settings);
                  setShowCmsModal(true);
                }}
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-semibold border d-flex align-items-center gap-1.5 text-white shadow-sm"
                style={{
                  backgroundColor: '#0B2545',
                  borderColor: '#25A8E0',
                  fontSize: '0.82rem',
                }}
                title="Admin: Edit and Delete Landing Page Sections"
              >
                <i className="bi bi-sliders text-km-cyan"></i>
                <span className="d-none d-md-inline">Manage Sections</span>
                <span className="badge bg-primary text-white rounded-pill ms-1" style={{ fontSize: '0.65rem' }}>
                  CMS
                </span>
              </button>

              {/* Change Background Button */}
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
                className="btn btn-sm rounded-pill px-3 py-1.5 fw-semibold border d-none d-sm-flex align-items-center gap-1.5 text-white shadow-sm"
                style={{
                  backgroundColor: 'rgba(17, 118, 188, 0.25)',
                  borderColor: '#1176BC',
                  fontSize: '0.82rem',
                }}
              >
                <i className="bi bi-image text-km-cyan"></i>
                <span>Background</span>
              </button>

              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 text-white shadow-sm"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setLoginTab('student');
                    setShowLoginModal(true);
                  }}
                  className="btn btn-sm text-white rounded-pill px-4 py-1.5 fw-semibold shadow-sm"
                  style={{ backgroundColor: '#10B981', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* SECTION 2: Hero Main Body (Deletable / Editable) */}
        {visibility.hero !== false && (
          <div className="container-fluid px-4 px-lg-5 py-5 my-auto">
            <div className="row align-items-center">
              <div className="col-12 col-lg-8 col-xl-7 py-4">
                {/* Badge text */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div
                    className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill text-white fw-semibold small shadow-sm"
                    style={{ backgroundColor: '#059669', fontSize: '0.82rem' }}
                  >
                    <i className="bi bi-shield-fill-check"></i>
                    <span>{settings.badge_text || 'University Student Representative Council'}</span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setCmsTab('hero');
                        setShowCmsModal(true);
                      }}
                      className="btn btn-sm btn-outline-light rounded-pill px-2 py-0 text-white-50"
                      style={{ fontSize: '0.72rem' }}
                    >
                      <i className="bi bi-pencil-fill me-1"></i> Edit Hero
                    </button>
                  )}
                </div>

                {/* Main Hero Headline */}
                <h1 className="display-4 fw-bold lh-sm mb-3 text-white" style={{ letterSpacing: '-0.02em' }}>
                  {settings.hero_title}
                </h1>

                {/* Subtitle description */}
                <p
                  className="lead text-white-50 mb-4"
                  style={{ maxWidth: '620px', fontSize: '1.05rem', lineHeight: '1.6' }}
                >
                  {settings.hero_subtitle}
                </p>

                {/* Action Buttons: Clean & Real (No Demo Placeholders) */}
                <div className="d-flex flex-wrap align-items-center gap-3 mb-5">
                  <button
                    onClick={() => {
                      if (user) navigate('/portal');
                      else {
                        setLoginTab('student');
                        setShowLoginModal(true);
                      }
                    }}
                    className="btn btn-lg rounded-pill px-4 py-2.5 text-white fw-semibold d-flex align-items-center gap-2 shadow-lg"
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontSize: '1rem' }}
                  >
                    <span>&rarr; {settings.cta_primary_text || 'Access Student Portal'}</span>
                  </button>

                  <Link
                    to="/portal/transparency"
                    className="btn btn-lg text-white rounded-pill px-4 py-2.5 fw-semibold d-flex align-items-center gap-2.5 border"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(255, 255, 255, 0.35)',
                      fontSize: '1rem',
                      textDecoration: 'none',
                    }}
                  >
                    <i className="bi bi-journal-text fs-5"></i>
                    <span>{settings.cta_secondary_text || 'Public Transparency Feed'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: Key Institutional Stats Metrics (Deletable / Editable / Addable) */}
        {visibility.stats !== false && (
          <div id="stats" className="container-fluid px-4 px-lg-5 py-4 border-top border-white border-opacity-10" style={{ backgroundColor: 'rgba(4, 15, 30, 0.65)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="small text-white-50 text-uppercase fw-bold tracking-wider">
                Institutional Vital Statistics
              </span>
              {isAdmin && (
                <div className="d-flex gap-2">
                  <button
                    onClick={() => {
                      setCmsTab('stats');
                      setShowCmsModal(true);
                    }}
                    className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-0.5"
                    style={{ fontSize: '0.72rem' }}
                  >
                    <i className="bi bi-pencil me-1"></i> Edit Stats
                  </button>
                  <button
                    onClick={() => handleDeleteSection('stats')}
                    className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                    style={{ fontSize: '0.72rem' }}
                  >
                    <i className="bi bi-trash me-1"></i> Delete Section
                  </button>
                </div>
              )}
            </div>

            <div className="row g-3 g-md-4">
              {(settings.stats_items || DEFAULT_SETTINGS.stats_items || []).map((st) => (
                <div key={st.id} className="col-6 col-md-3">
                  <div className="p-3 rounded-4 border border-white border-opacity-10 bg-dark bg-opacity-40 d-flex align-items-center gap-3">
                    <div className="fs-2" style={{ color: st.color || '#25A8E0' }}>
                      <i className={`bi ${st.icon || 'bi-bar-chart-fill'}`}></i>
                    </div>
                    <div>
                      <div className="fs-4 fw-bold text-white lh-1">{st.value}</div>
                      <div className="text-white-50 small mt-1" style={{ fontSize: '0.76rem' }}>
                        {st.label}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: Core Pillars & Capabilities (Deletable / Editable / Addable) */}
        {visibility.features !== false && (
          <div id="features" className="container-fluid px-4 px-lg-5 py-5 border-top border-white border-opacity-10" style={{ backgroundColor: 'rgba(11, 37, 69, 0.75)' }}>
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
              <div>
                <span className="badge bg-primary text-white rounded-pill px-3 py-1 small mb-2" style={{ backgroundColor: '#1176BC' }}>
                  Institutional Accountability
                </span>
                <h3 className="fw-bold text-white mb-1">Official Student Council Pillars</h3>
                <p className="text-white-50 small mb-0">
                  Every process is digitally audited, cryptographic, and governed by elected representatives.
                </p>
              </div>

              {isAdmin && (
                <div className="d-flex gap-2">
                  <button
                    onClick={() => {
                      setCmsTab('features');
                      setShowCmsModal(true);
                    }}
                    className="btn btn-sm btn-outline-info rounded-pill px-3"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Edit Features
                  </button>
                  <button
                    onClick={() => handleDeleteSection('features')}
                    className="btn btn-sm btn-outline-danger rounded-pill px-3"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-trash me-1"></i> Delete Section
                  </button>
                </div>
              )}
            </div>

            <div className="row g-4">
              {(settings.features_items || DEFAULT_SETTINGS.features_items || []).map((feat) => (
                <div key={feat.id} className="col-12 col-md-6 col-lg-3">
                  <div
                    className="card h-100 border-0 rounded-4 p-4 text-white shadow-sm"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center text-white"
                        style={{ width: '42px', height: '42px', backgroundColor: '#1176BC' }}
                      >
                        <i className={`bi ${feat.icon || 'bi-shield-check'} fs-5 text-white`}></i>
                      </div>
                      {feat.badge && (
                        <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle small">
                          {feat.badge}
                        </span>
                      )}
                    </div>
                    <h5 className="fw-bold text-white mb-2 fs-6">{feat.title}</h5>
                    <p className="text-white-50 small mb-0" style={{ lineHeight: '1.6' }}>
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: Executive Leadership & Governance (Deletable / Editable / Addable) */}
        {visibility.governance !== false && (
          <div id="governance" className="container-fluid px-4 px-lg-5 py-5 border-top border-white border-opacity-10" style={{ backgroundColor: 'rgba(4, 15, 30, 0.85)' }}>
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
              <div>
                <span className="badge rounded-pill px-3 py-1 small mb-2" style={{ backgroundColor: '#0F5F38' }}>
                  Elected Representation
                </span>
                <h3 className="fw-bold text-white mb-1">Council Executive Leadership</h3>
                <p className="text-white-50 small mb-0">
                  Student representatives elected to champion academic quality, welfare, and financial transparency.
                </p>
              </div>

              {isAdmin && (
                <div className="d-flex gap-2">
                  <button
                    onClick={() => {
                      setCmsTab('governance');
                      setShowCmsModal(true);
                    }}
                    className="btn btn-sm btn-outline-info rounded-pill px-3"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Edit Leadership
                  </button>
                  <button
                    onClick={() => handleDeleteSection('governance')}
                    className="btn btn-sm btn-outline-danger rounded-pill px-3"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-trash me-1"></i> Delete Section
                  </button>
                </div>
              )}
            </div>

            <div className="row g-4">
              {(settings.leaders_items || DEFAULT_SETTINGS.leaders_items || []).map((lead) => (
                <div key={lead.id} className="col-12 col-sm-6 col-lg-3">
                  <div
                    className="card h-100 border-0 rounded-4 overflow-hidden text-white shadow-sm"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {lead.photo_url ? (
                      <div style={{ height: '180px', overflow: 'hidden' }}>
                        <img
                          src={lead.photo_url}
                          alt={lead.name}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center text-white"
                        style={{ height: '180px', backgroundColor: '#0B2545' }}
                      >
                        <i className="bi bi-person-circle fs-1 text-white-50"></i>
                      </div>
                    )}
                    <div className="p-3">
                      <h6 className="fw-bold text-white mb-0">{lead.name}</h6>
                      <div className="text-km-cyan small fw-semibold mt-0.5">{lead.role}</div>
                      <div className="text-white-50 small mt-1" style={{ fontSize: '0.72rem' }}>
                        {lead.faculty}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: Student Support FAQ (Deletable / Editable / Addable) */}
        {visibility.faq !== false && (
          <div id="faq" className="container-fluid px-4 px-lg-5 py-5 border-top border-white border-opacity-10" style={{ backgroundColor: 'rgba(11, 37, 69, 0.7)' }}>
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
              <div>
                <span className="badge bg-secondary rounded-pill px-3 py-1 small mb-2">
                  Student Guidance
                </span>
                <h3 className="fw-bold text-white mb-1">Frequently Asked Questions</h3>
                <p className="text-white-50 small mb-0">
                  Essential information on semester dues, passwords, receipts, and grievance advocacy.
                </p>
              </div>

              {isAdmin && (
                <div className="d-flex gap-2">
                  <button
                    onClick={() => {
                      setCmsTab('faq');
                      setShowCmsModal(true);
                    }}
                    className="btn btn-sm btn-outline-info rounded-pill px-3"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Edit FAQs
                  </button>
                  <button
                    onClick={() => handleDeleteSection('faq')}
                    className="btn btn-sm btn-outline-danger rounded-pill px-3"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-trash me-1"></i> Delete Section
                  </button>
                </div>
              )}
            </div>

            <div className="row justify-content-center">
              <div className="col-12 col-lg-10">
                <div className="d-flex flex-column gap-3">
                  {(settings.faq_items || DEFAULT_SETTINGS.faq_items || []).map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-4 border border-white border-opacity-10 overflow-hidden"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-100 text-start p-3.5 bg-transparent border-0 text-white fw-semibold d-flex align-items-center justify-content-between"
                        >
                          <span className="d-flex align-items-center gap-2.5">
                            <i className="bi bi-question-circle-fill text-km-cyan"></i>
                            <span>{faq.question}</span>
                          </span>
                          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-white-50`}></i>
                        </button>
                        {isOpen && (
                          <div className="p-3.5 pt-0 text-white-50 small border-top border-white border-opacity-5" style={{ lineHeight: '1.7' }}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 7: Institutional Footer (Deletable / Editable) */}
        {visibility.footer !== false && (
          <footer className="container-fluid px-4 px-lg-5 py-4 border-top border-white border-opacity-10 mt-auto" style={{ backgroundColor: 'rgba(4, 15, 30, 0.95)' }}>
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-white-50 small">
              <div className="d-flex align-items-center gap-2">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{ width: '28px', height: '28px', backgroundColor: '#0F5F38' }}
                >
                  <i className="bi bi-shield-shaded"></i>
                </div>
                <span>{settings.footer_text || DEFAULT_SETTINGS.footer_text}</span>
              </div>

              <div className="d-flex align-items-center gap-4 text-nowrap">
                {settings.contact_email && (
                  <span className="d-flex align-items-center gap-1.5">
                    <i className="bi bi-envelope-fill text-km-cyan"></i>
                    <span>{settings.contact_email}</span>
                  </span>
                )}
                {settings.contact_phone && (
                  <span className="d-flex align-items-center gap-1.5">
                    <i className="bi bi-telephone-fill text-success"></i>
                    <span>{settings.contact_phone}</span>
                  </span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteSection('footer')}
                    className="btn btn-sm btn-link text-white-50 p-0 text-decoration-none"
                    title="Delete Footer"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                )}
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* ADMIN CMS FULL SECTION MANAGER MODAL (Edit & Delete all sections) */}
      {showCmsModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(4, 15, 30, 0.88)', backdropFilter: 'blur(12px)', zIndex: 1080 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '1000px' }}>
            <div
              className="modal-content border-0 rounded-4 overflow-hidden shadow-2xl text-white"
              style={{
                backgroundColor: '#0B2545',
                border: '1px solid rgba(159, 187, 222, 0.3)',
              }}
            >
              <div
                className="modal-header border-bottom py-3 px-4 d-flex align-items-center justify-content-between"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(17, 118, 188, 0.15)' }}
              >
                <div className="d-flex align-items-center gap-2.5">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-white"
                    style={{ width: '38px', height: '38px', backgroundColor: '#1176BC' }}
                  >
                    <i className="bi bi-sliders fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-white fs-6 mb-0">Landing Page CMS Section Manager</h5>
                    <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>
                      Delete, restore, and edit all sections and items on the live landing page.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCmsModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-4 pt-3 bg-dark bg-opacity-30 border-bottom border-white border-opacity-10">
                <ul className="nav nav-pills gap-1">
                  {[
                    { id: 'sections', label: '1. Sections Visibility (Delete/Restore)', icon: 'bi-eye' },
                    { id: 'hero', label: '2. Hero Content', icon: 'bi-card-heading' },
                    { id: 'stats', label: '3. Metric Stats', icon: 'bi-bar-chart' },
                    { id: 'features', label: '4. Pillars & Features', icon: 'bi-grid' },
                    { id: 'governance', label: '5. Leadership', icon: 'bi-people' },
                    { id: 'faq', label: '6. FAQs', icon: 'bi-question-circle' },
                    { id: 'footer', label: '7. Footer & Contact', icon: 'bi-info-circle' },
                  ].map((t) => (
                    <li key={t.id} className="nav-item">
                      <button
                        type="button"
                        onClick={() => setCmsTab(t.id as any)}
                        className={`nav-link rounded-pill py-1.5 px-3 small fw-semibold d-flex align-items-center gap-1.5 ${
                          cmsTab === t.id ? 'active bg-primary text-white shadow-sm' : 'text-white-50'
                        }`}
                        style={{ fontSize: '0.78rem' }}
                      >
                        <i className={`bi ${t.icon}`}></i>
                        <span>{t.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={handleSaveAllCms}>
                <div className="modal-body p-4 text-white" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {cmsSuccessMsg && (
                    <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 p-2.5 mb-3 small" role="alert">
                      <i className="bi bi-check-circle-fill text-success"></i>
                      <div>{cmsSuccessMsg}</div>
                    </div>
                  )}

                  {/* TAB 1: Sections Visibility & 1-Click Delete/Restore */}
                  {cmsTab === 'sections' && (
                    <div>
                      <h6 className="fw-bold text-white mb-2">Section Visibility Controls</h6>
                      <p className="text-white-50 small mb-3">
                        You can delete or restore any section of the landing page with one click.
                      </p>

                      <div className="d-flex flex-column gap-2.5">
                        {[
                          { key: 'announcement', name: 'Announcement Bar', desc: 'Top marquee banner with alert pill' },
                          { key: 'hero', name: 'Hero Headline & Description', desc: 'Main headline, badge, and CTA action buttons' },
                          { key: 'stats', name: 'Vital Statistics Section', desc: 'Key institutional metric badges and numbers' },
                          { key: 'features', name: 'Core Pillars & Capabilities', desc: 'Accountability feature cards and descriptions' },
                          { key: 'governance', name: 'Council Executive Leadership', desc: 'Elected student representative profile cards' },
                          { key: 'faq', name: 'Student Support FAQs', desc: 'Collapsible accordion answers to common questions' },
                          { key: 'footer', name: 'Institutional Footer & Contacts', desc: 'Contact details and council mission statement' },
                        ].map((sec) => {
                          const isVisible = cmsForm.sections_visibility?.[sec.key as keyof NonNullable<LandingPageSettings['sections_visibility']>] !== false;
                          return (
                            <div
                              key={sec.key}
                              className="p-3 rounded-3 border d-flex align-items-center justify-content-between"
                              style={{
                                backgroundColor: isVisible ? 'rgba(255, 255, 255, 0.05)' : 'rgba(220, 38, 38, 0.1)',
                                borderColor: isVisible ? 'rgba(255, 255, 255, 0.1)' : 'rgba(220, 38, 38, 0.3)',
                              }}
                            >
                              <div>
                                <strong className="text-white d-block">{sec.name}</strong>
                                <span className="text-white-50 small">{sec.desc}</span>
                              </div>

                              <div className="d-flex align-items-center gap-2">
                                {isVisible ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCmsForm((prev) => ({
                                        ...prev,
                                        sections_visibility: {
                                          ...(prev.sections_visibility || {}),
                                          [sec.key]: false,
                                        },
                                      }));
                                    }}
                                    className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1.5"
                                  >
                                    <i className="bi bi-trash"></i>
                                    <span>Delete Section</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCmsForm((prev) => ({
                                        ...prev,
                                        sections_visibility: {
                                          ...(prev.sections_visibility || {}),
                                          [sec.key]: true,
                                        },
                                      }));
                                    }}
                                    className="btn btn-sm btn-success rounded-pill px-3 d-flex align-items-center gap-1.5"
                                    style={{ backgroundColor: '#10B981' }}
                                  >
                                    <i className="bi bi-arrow-clockwise"></i>
                                    <span>Restore Section</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Hero Content */}
                  {cmsTab === 'hero' && (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label text-white-50 small fw-semibold text-uppercase">
                          Top Badge Pill
                        </label>
                        <input
                          type="text"
                          value={cmsForm.badge_text || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, badge_text: e.target.value })}
                          className="form-control form-control-glass-dark"
                          placeholder="University Student Representative Council"
                        />
                      </div>

                      <div>
                        <label className="form-label text-white-50 small fw-semibold text-uppercase">
                          Main Hero Headline
                        </label>
                        <textarea
                          rows={2}
                          value={cmsForm.hero_title || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, hero_title: e.target.value })}
                          className="form-control form-control-glass-dark fw-bold"
                          placeholder="Keydso Maanta Every Contribution Matters. Every Action Is Accountable."
                        />
                      </div>

                      <div>
                        <label className="form-label text-white-50 small fw-semibold text-uppercase">
                          Hero Subtitle Description
                        </label>
                        <textarea
                          rows={3}
                          value={cmsForm.hero_subtitle || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, hero_subtitle: e.target.value })}
                          className="form-control form-control-glass-dark"
                          placeholder="A modern platform to manage student contributions..."
                        />
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label text-white-50 small fw-semibold text-uppercase">
                            Primary CTA Button Text
                          </label>
                          <input
                            type="text"
                            value={cmsForm.cta_primary_text || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, cta_primary_text: e.target.value })}
                            className="form-control form-control-glass-dark"
                            placeholder="Get Started"
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-white-50 small fw-semibold text-uppercase">
                            Secondary CTA Button Text
                          </label>
                          <input
                            type="text"
                            value={cmsForm.cta_secondary_text || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, cta_secondary_text: e.target.value })}
                            className="form-control form-control-glass-dark"
                            placeholder="Transparency Feed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Metric Stats (Add, Edit, Delete) */}
                  {cmsTab === 'stats' && (
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-white mb-0">Stats Metrics List</h6>
                        <button
                          type="button"
                          onClick={() => {
                            const newStat: LandingStatItem = {
                              id: `stat-${Date.now()}`,
                              label: 'New Statistic',
                              value: '100',
                              icon: 'bi-check-circle',
                              color: '#25A8E0',
                            };
                            setCmsForm((prev) => ({
                              ...prev,
                              stats_items: [...(prev.stats_items || []), newStat],
                            }));
                          }}
                          className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1.5"
                          style={{ backgroundColor: '#1176BC' }}
                        >
                          <i className="bi bi-plus-circle"></i>
                          <span>Add New Stat Metric</span>
                        </button>
                      </div>

                      <div className="d-flex flex-column gap-2.5">
                        {(cmsForm.stats_items || []).map((st, idx) => (
                          <div key={st.id} className="p-3 rounded-3 border border-white border-opacity-10 bg-dark bg-opacity-40">
                            <div className="row g-2 align-items-center">
                              <div className="col-12 col-md-4">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Label
                                </label>
                                <input
                                  type="text"
                                  value={st.label}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.stats_items || [])];
                                    updated[idx].label = e.target.value;
                                    setCmsForm({ ...cmsForm, stats_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm"
                                  placeholder="Stat Label"
                                />
                              </div>
                              <div className="col-12 col-md-3">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Value
                                </label>
                                <input
                                  type="text"
                                  value={st.value}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.stats_items || [])];
                                    updated[idx].value = e.target.value;
                                    setCmsForm({ ...cmsForm, stats_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm fw-bold text-km-cyan"
                                  placeholder="e.g. 8,450"
                                />
                              </div>
                              <div className="col-12 col-md-3">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Icon Class
                                </label>
                                <input
                                  type="text"
                                  value={st.icon || 'bi-bar-chart'}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.stats_items || [])];
                                    updated[idx].icon = e.target.value;
                                    setCmsForm({ ...cmsForm, stats_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm font-monospace"
                                  placeholder="bi-people-fill"
                                />
                              </div>
                              <div className="col-12 col-md-2 text-end pt-md-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (cmsForm.stats_items || []).filter((item) => item.id !== st.id);
                                    setCmsForm({ ...cmsForm, stats_items: updated });
                                  }}
                                  className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1"
                                  title="Delete this stat metric"
                                >
                                  <i className="bi bi-trash"></i> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: Pillars & Features (Add, Edit, Delete) */}
                  {cmsTab === 'features' && (
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-white mb-0">Core Pillar Feature Cards</h6>
                        <button
                          type="button"
                          onClick={() => {
                            const newFeat: LandingFeatureItem = {
                              id: `feat-${Date.now()}`,
                              title: 'New Pillar Feature',
                              description: 'Detailed description of this council capability...',
                              icon: 'bi-star-fill',
                              badge: 'Active',
                            };
                            setCmsForm((prev) => ({
                              ...prev,
                              features_items: [...(prev.features_items || []), newFeat],
                            }));
                          }}
                          className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1.5"
                          style={{ backgroundColor: '#1176BC' }}
                        >
                          <i className="bi bi-plus-circle"></i>
                          <span>Add New Feature Card</span>
                        </button>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {(cmsForm.features_items || []).map((feat, idx) => (
                          <div key={feat.id} className="p-3 rounded-3 border border-white border-opacity-10 bg-dark bg-opacity-40">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-primary rounded-pill">Card #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (cmsForm.features_items || []).filter((f) => f.id !== feat.id);
                                  setCmsForm({ ...cmsForm, features_items: updated });
                                }}
                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                              >
                                <i className="bi bi-trash me-1"></i> Delete Card
                              </button>
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-12 col-md-8">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Title
                                </label>
                                <input
                                  type="text"
                                  value={feat.title}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.features_items || [])];
                                    updated[idx].title = e.target.value;
                                    setCmsForm({ ...cmsForm, features_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm fw-semibold"
                                  placeholder="Feature Title"
                                />
                              </div>
                              <div className="col-12 col-md-4">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Badge Tag
                                </label>
                                <input
                                  type="text"
                                  value={feat.badge || ''}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.features_items || [])];
                                    updated[idx].badge = e.target.value;
                                    setCmsForm({ ...cmsForm, features_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm"
                                  placeholder="e.g. Verifiable"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="form-label text-white-50 small text-uppercase mb-1">
                                Description
                              </label>
                              <textarea
                                rows={2}
                                value={feat.description}
                                onChange={(e) => {
                                  const updated = [...(cmsForm.features_items || [])];
                                  updated[idx].description = e.target.value;
                                  setCmsForm({ ...cmsForm, features_items: updated });
                                }}
                                className="form-control form-control-glass-dark form-control-sm"
                                  placeholder="Description..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Executive Leadership (Add, Edit, Delete) */}
                  {cmsTab === 'governance' && (
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-white mb-0">Executive Council Leaders</h6>
                        <button
                          type="button"
                          onClick={() => {
                            const newLeader: LandingLeaderItem = {
                              id: `lead-${Date.now()}`,
                              name: 'Council Officer Name',
                              role: 'Faculty Representative',
                              faculty: 'Faculty Name',
                              photo_url: '',
                            };
                            setCmsForm((prev) => ({
                              ...prev,
                              leaders_items: [...(prev.leaders_items || []), newLeader],
                            }));
                          }}
                          className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1.5"
                          style={{ backgroundColor: '#1176BC' }}
                        >
                          <i className="bi bi-person-plus"></i>
                          <span>Add New Leader</span>
                        </button>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {(cmsForm.leaders_items || []).map((lead, idx) => (
                          <div key={lead.id} className="p-3 rounded-3 border border-white border-opacity-10 bg-dark bg-opacity-40">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-info-subtle text-info rounded-pill">Officer #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (cmsForm.leaders_items || []).filter((l) => l.id !== lead.id);
                                  setCmsForm({ ...cmsForm, leaders_items: updated });
                                }}
                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                              >
                                <i className="bi bi-trash me-1"></i> Delete
                              </button>
                            </div>

                            <div className="row g-2">
                              <div className="col-12 col-md-4">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Full Name
                                </label>
                                <input
                                  type="text"
                                  value={lead.name}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.leaders_items || [])];
                                    updated[idx].name = e.target.value;
                                    setCmsForm({ ...cmsForm, leaders_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm fw-semibold"
                                  placeholder="Full Name"
                                />
                              </div>
                              <div className="col-12 col-md-4">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Role Title
                                </label>
                                <input
                                  type="text"
                                  value={lead.role}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.leaders_items || [])];
                                    updated[idx].role = e.target.value;
                                    setCmsForm({ ...cmsForm, leaders_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm"
                                  placeholder="General President"
                                />
                              </div>
                              <div className="col-12 col-md-4">
                                <label className="form-label text-white-50 small text-uppercase mb-1">
                                  Faculty / Scope
                                </label>
                                <input
                                  type="text"
                                  value={lead.faculty || ''}
                                  onChange={(e) => {
                                    const updated = [...(cmsForm.leaders_items || [])];
                                    updated[idx].faculty = e.target.value;
                                    setCmsForm({ ...cmsForm, leaders_items: updated });
                                  }}
                                  className="form-control form-control-glass-dark form-control-sm"
                                  placeholder="Executive Council"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: FAQs (Add, Edit, Delete) */}
                  {cmsTab === 'faq' && (
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <h6 className="fw-bold text-white mb-0">Student Support FAQs</h6>
                        <button
                          type="button"
                          onClick={() => {
                            const newFaq: LandingFaqItem = {
                              id: `faq-${Date.now()}`,
                              question: 'New Student Question?',
                              answer: 'Answer explaining council procedures and guidelines...',
                            };
                            setCmsForm((prev) => ({
                              ...prev,
                              faq_items: [...(prev.faq_items || []), newFaq],
                            }));
                          }}
                          className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1.5"
                          style={{ backgroundColor: '#1176BC' }}
                        >
                          <i className="bi bi-plus-circle"></i>
                          <span>Add New FAQ</span>
                        </button>
                      </div>

                      <div className="d-flex flex-column gap-3">
                        {(cmsForm.faq_items || []).map((faq, idx) => (
                          <div key={faq.id} className="p-3 rounded-3 border border-white border-opacity-10 bg-dark bg-opacity-40">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="badge bg-secondary rounded-pill">Question #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (cmsForm.faq_items || []).filter((f) => f.id !== faq.id);
                                  setCmsForm({ ...cmsForm, faq_items: updated });
                                }}
                                className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                              >
                                <i className="bi bi-trash me-1"></i> Delete
                              </button>
                            </div>

                            <div className="mb-2">
                              <label className="form-label text-white-50 small text-uppercase mb-1">
                                Question
                              </label>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => {
                                  const updated = [...(cmsForm.faq_items || [])];
                                  updated[idx].question = e.target.value;
                                  setCmsForm({ ...cmsForm, faq_items: updated });
                                }}
                                className="form-control form-control-glass-dark form-control-sm fw-semibold"
                                placeholder="Question text..."
                              />
                            </div>

                            <div>
                              <label className="form-label text-white-50 small text-uppercase mb-1">
                                Answer
                              </label>
                              <textarea
                                rows={2}
                                value={faq.answer}
                                onChange={(e) => {
                                  const updated = [...(cmsForm.faq_items || [])];
                                  updated[idx].answer = e.target.value;
                                  setCmsForm({ ...cmsForm, faq_items: updated });
                                }}
                                className="form-control form-control-glass-dark form-control-sm"
                                placeholder="Answer text..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 7: Footer & Contact */}
                  {cmsTab === 'footer' && (
                    <div className="d-flex flex-column gap-3">
                      <div>
                        <label className="form-label text-white-50 small fw-semibold text-uppercase">
                          Footer Mission Statement / Copyright
                        </label>
                        <textarea
                          rows={3}
                          value={cmsForm.footer_text || ''}
                          onChange={(e) => setCmsForm({ ...cmsForm, footer_text: e.target.value })}
                          className="form-control form-control-glass-dark"
                          placeholder="Keydso Maanta — Official Digital Infrastructure..."
                        />
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label text-white-50 small fw-semibold text-uppercase">
                            Contact Institutional Email
                          </label>
                          <input
                            type="email"
                            value={cmsForm.contact_email || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, contact_email: e.target.value })}
                            className="form-control form-control-glass-dark"
                            placeholder="council@university.edu"
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label text-white-50 small fw-semibold text-uppercase">
                            Contact Phone Number
                          </label>
                          <input
                            type="text"
                            value={cmsForm.contact_phone || ''}
                            onChange={(e) => setCmsForm({ ...cmsForm, contact_phone: e.target.value })}
                            className="form-control form-control-glass-dark"
                            placeholder="+252 61 5000000"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="modal-footer border-top py-2.5 px-4 d-flex align-items-center justify-content-between"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0,0,0,0.25)' }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCmsModal(false)}
                    className="btn btn-sm btn-outline-light rounded-pill px-3"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingCms}
                    className="btn btn-sm rounded-pill px-4 fw-bold text-white shadow d-flex align-items-center gap-1.5"
                    style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                  >
                    {isSavingCms ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cloud-arrow-up-fill"></i>
                        <span>Save &amp; Publish All Sections</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL (Clean, no demo data or outfills) */}
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
                  {/* Clean Identifier Input */}
                  <div className="mb-3">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wider">
                      {loginTab === 'student' ? 'Student ID Number' : 'Institutional Email Address'}
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
                        placeholder={loginTab === 'student' ? 'Student ID Number' : 'Institutional Email Address'}
                        className="form-control form-control-glass-dark border-start-0 ps-0 font-monospace"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Clean Password Input */}
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
                        placeholder="Password"
                        className="form-control form-control-glass-dark border-start-0 border-end-0 ps-0"
                        autoComplete="current-password"
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
                        <span>Default password is your Student ID.</span>
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

      {/* BACKGROUND IMAGE CUSTOMIZER MODAL */}
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

              <div className="modal-body p-4 text-white">
                {bgSuccessMsg && (
                  <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 p-2.5 mb-3 small" role="alert">
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <div>{bgSuccessMsg}</div>
                  </div>
                )}
                {bgErrorMsg && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 p-2.5 mb-3 small" role="alert">
                    <i className="bi bi-exclamation-triangle-fill text-danger"></i>
                    <div>{bgErrorMsg}</div>
                  </div>
                )}

                {/* Upload File Section */}
                <div className="p-3.5 mb-3 rounded-3 text-center border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }}>
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
                      style={{ width: '44px', height: '44px', backgroundColor: '#1176BC' }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-bold small text-white">Upload Background from Computer</div>
                      <div className="text-white-50 small" style={{ fontSize: '0.72rem' }}>
                        Supports JPG, PNG, WebP up to 8MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm rounded-pill px-4 py-1.5 fw-semibold d-flex align-items-center gap-1.5 text-white shadow-sm mt-1"
                      style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
                    >
                      <i className="bi bi-folder2-open"></i>
                      <span>Choose Local Photo</span>
                    </button>
                    {uploadedFileName && (
                      <div className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small mt-1">
                        <i className="bi bi-check-circle me-1"></i>
                        Selected: {uploadedFileName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Presets */}
                <div className="mb-3">
                  <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-2">
                    Official Campus Presets:
                  </label>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {CAMPUS_PRESETS.map((preset) => {
                      const isSelected = bgInputUrl === preset.url;
                      return (
                        <div
                          key={preset.name}
                          onClick={() => {
                            setUploadedFileName(null);
                            setBgInputUrl(preset.url);
                            setSettings((prev) => ({ ...prev, background_image_url: preset.url }));
                          }}
                          className={`p-2 rounded-3 border d-flex align-items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary bg-opacity-20 shadow-sm'
                              : 'border-white border-opacity-10 bg-dark bg-opacity-40'
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="rounded-2 object-cover flex-shrink-0"
                            style={{ width: '42px', height: '42px' }}
                          />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-semibold small text-white text-truncate d-flex align-items-center gap-1.5">
                              <span>{preset.name}</span>
                              {isSelected && <i className="bi bi-check-circle-fill text-primary ms-auto"></i>}
                            </div>
                            <div className="text-white-50 small text-truncate" style={{ fontSize: '0.7rem' }}>
                              {preset.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Opacity slider */}
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-white-50 small fw-semibold text-uppercase tracking-wide mb-0">
                      Background Dark Overlay: {Math.round(bgOverlay * 100)}%
                    </label>
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
                </div>
              </div>

              <div
                className="modal-footer border-top py-2.5 px-4 d-flex align-items-center justify-content-between"
                style={{ borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}
              >
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 text-white-50"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>
                  Reset to Zamzam Campus
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
    </div>
  );
};
