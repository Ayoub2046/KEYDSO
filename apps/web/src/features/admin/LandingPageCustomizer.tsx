import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import {
  LandingPageSettings,
  LandingStatItem,
  LandingFeatureItem,
  LandingLeaderItem,
  LandingFaqItem,
} from '@keydso/shared-types';

const CAMPUS_PRESETS = [
  {
    name: 'Zamzam University Science & Tech (Students Hero)',
    url: '/zamzam_hero.jpg',
    description: 'Official university campus with students and science faculty building',
    badge: 'Recommended',
  },
  {
    name: 'Modern University Campus Quad',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80',
    description: 'Iconic university library and student quadrangle',
  },
  {
    name: 'Students Collaborating & Studying',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80',
    description: 'Energetic campus study group in modern learning space',
  },
  {
    name: 'University Main Hall & Lawn',
    url: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80',
    description: 'Prestigious academic architecture with campus grounds',
  },
  {
    name: 'Academic Library & Research Hall',
    url: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1920&q=80',
    description: 'Deep focus study atrium with natural ambient lighting',
  },
];

const DEFAULT_SETTINGS: LandingPageSettings = {
  hero_title: 'Keydso Maanta Every Contribution Matters. Every Action Is Accountable.',
  hero_subtitle: 'A modern platform to manage student contributions, representatives, activities and university affairs with full transparency and trust.',
  badge_text: 'University Student Representative Council',
  background_image_url: '/zamzam_hero.jpg',
  background_overlay_opacity: 0.65,
  stat_students_count: '8,450',
  stat_treasury_amount: '8 Faculties',
  stat_audit_rate: '100% Transparency',
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
    { id: 'lead-1', name: 'Prof. Hassan Mohamed', role: 'General President', faculty: 'Executive Council', photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { id: 'lead-2', name: 'Dr. Amina Farah', role: 'Faculty President', faculty: 'Faculty of Engineering', photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' },
    { id: 'lead-3', name: 'Ahmed Yusuf', role: 'Finance Officer', faculty: 'Treasury & Audit', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { id: 'lead-4', name: 'Hodan Osman', role: 'Secretary General', faculty: 'Academic Affairs', photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80' },
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

export const LandingPageCustomizer: React.FC = () => {
  const [settings, setSettings] = useState<LandingPageSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'stats' | 'features' | 'governance' | 'faq' | 'footer'>('hero');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLandingSettings();
      if (data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data,
          sections_visibility: {
            ...DEFAULT_SETTINGS.sections_visibility,
            ...(data.sections_visibility || {}),
          },
          stats_items: data.stats_items && data.stats_items.length > 0 ? data.stats_items : DEFAULT_SETTINGS.stats_items,
          features_items: data.features_items && data.features_items.length > 0 ? data.features_items : DEFAULT_SETTINGS.features_items,
          leaders_items: data.leaders_items && data.leaders_items.length > 0 ? data.leaders_items : DEFAULT_SETTINGS.leaders_items,
          faq_items: data.faq_items && data.faq_items.length > 0 ? data.faq_items : DEFAULT_SETTINGS.faq_items,
        });
      }
    } catch (err: any) {
      console.warn('Using default settings because server gave:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please select a smaller photo or compress it.');
      return;
    }

    setErrorMessage(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSettings((prev) => ({
          ...prev,
          background_image_url: result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (url: string) => {
    setUploadedFileName(null);
    setSettings((prev) => ({ ...prev, background_image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      try {
        localStorage.setItem('km_landing_full_settings', JSON.stringify(settings));
        localStorage.setItem('km_landing_bg', settings.background_image_url);
        localStorage.setItem('km_landing_overlay', String(settings.background_overlay_opacity));
      } catch (e) {
        // safe
      }

      const updated = await api.updateLandingSettings(settings);
      setSettings((prev) => ({
        ...prev,
        ...updated,
      }));
      setSuccessMessage('Landing page background and all sections published successfully! Changes are live immediately.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update landing page settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all landing page sections and background to official university defaults?')) {
      setUploadedFileName(null);
      setSettings(DEFAULT_SETTINGS);
      try {
        localStorage.removeItem('km_landing_full_settings');
        localStorage.removeItem('km_landing_bg');
        localStorage.removeItem('km_landing_overlay');
      } catch {
        // safe
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading settings...</span>
        </div>
        <div className="text-muted small mt-2">Loading Landing Page CMS...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-2">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h3 className="fw-bold mb-0 text-dark">Landing Page CMS &amp; Section Manager</h3>
            <span className="badge bg-primary text-white rounded-pill" style={{ backgroundColor: '#1176BC' }}>
              Admin Control
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Edit and delete sections, customize headlines, background imagery, metrics, pillar cards, and FAQs.
          </p>
        </div>

        <div className="d-flex gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-box-arrow-up-right"></i>
            <span>View Live Landing Page</span>
          </a>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="btn btn-outline-warning btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
          >
            <i className="bi bi-arrow-counterclockwise"></i>
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="alert alert-success d-flex align-items-center gap-2 rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill text-success fs-5 flex-shrink-0"></i>
          <div>{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 mb-4 shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill text-danger fs-5 flex-shrink-0"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-2.5">
          <ul className="nav nav-pills gap-1 flex-wrap">
            {[
              { id: 'hero', label: 'Hero & Background', icon: 'bi-image' },
              { id: 'sections', label: 'Section Deletion & Visibility', icon: 'bi-eye' },
              { id: 'stats', label: 'Metric Stats', icon: 'bi-bar-chart' },
              { id: 'features', label: 'Core Pillars', icon: 'bi-grid' },
              { id: 'governance', label: 'Leadership', icon: 'bi-people' },
              { id: 'faq', label: 'FAQs', icon: 'bi-question-circle' },
              { id: 'footer', label: 'Footer & Contact', icon: 'bi-info-circle' },
            ].map((tab) => (
              <li key={tab.id} className="nav-item">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`nav-link rounded-pill py-2 px-3.5 small fw-bold d-flex align-items-center gap-2 ${
                    activeTab === tab.id ? 'active bg-primary text-white shadow-sm' : 'text-secondary'
                  }`}
                  style={{ backgroundColor: activeTab === tab.id ? '#1176BC' : 'transparent' }}
                >
                  <i className={`bi ${tab.icon}`}></i>
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* TAB 1: HERO & BACKGROUND */}
        {activeTab === 'hero' && (
          <div className="row g-4">
            {/* Left Preview Column */}
            <div className="col-12 col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 sticky-lg-top" style={{ top: '80px' }}>
                <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                  <h6 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                    <i className="bi bi-image text-primary"></i>
                    <span>Background Image</span>
                  </h6>
                  <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                    Live Preview
                  </span>
                </div>

                <div className="card-body p-3">
                  <div
                    className="rounded-3 position-relative overflow-hidden mb-3 shadow d-flex flex-column justify-content-end p-3 text-white border"
                    style={{
                      height: '240px',
                      backgroundImage: `url('${settings.background_image_url}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background: `linear-gradient(to right, rgba(4, 15, 30, ${settings.background_overlay_opacity + 0.15}) 0%, rgba(4, 15, 30, ${settings.background_overlay_opacity}) 60%, transparent 100%)`,
                      }}
                    />
                    <div className="position-relative z-1">
                      <span className="badge rounded-pill mb-1.5 small" style={{ fontSize: '0.68rem', backgroundColor: '#10B981' }}>
                        {settings.badge_text || 'Official Portal'}
                      </span>
                      <h6 className="fw-bold text-white mb-1 line-clamp-2">
                        {settings.hero_title || 'Hero Title Here'}
                      </h6>
                      <p className="small text-white-50 mb-0 line-clamp-2" style={{ fontSize: '0.74rem' }}>
                        {settings.hero_subtitle || 'Subtitle description...'}
                      </p>
                    </div>
                  </div>

                  {/* Upload from Computer */}
                  <div className="p-3 mb-3 bg-light rounded-3 border text-center">
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
                        style={{ width: '40px', height: '40px', backgroundColor: '#1176BC' }}
                      >
                        <i className="bi bi-cloud-arrow-up fs-5"></i>
                      </div>
                      <div>
                        <div className="fw-bold small text-dark">Upload from Computer</div>
                        <div className="text-muted small" style={{ fontSize: '0.72rem' }}>JPG, PNG, WebP up to 8MB</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary btn-sm rounded-pill px-3 py-1 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                        style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
                      >
                        <i className="bi bi-folder2-open"></i>
                        <span>Choose File</span>
                      </button>
                    </div>
                  </div>

                  {/* Darkness slider */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide mb-0">
                        Overlay Darkness ({Math.round(settings.background_overlay_opacity * 100)}%)
                      </label>
                      <span className="badge bg-light text-dark border small">{settings.background_overlay_opacity}</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="0.9"
                      step="0.05"
                      value={settings.background_overlay_opacity}
                      onChange={(e) => setSettings({ ...settings, background_overlay_opacity: parseFloat(e.target.value) })}
                      className="form-range"
                    />
                  </div>

                  {/* Campus Presets */}
                  <div>
                    <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide mb-2">
                      Official Presets:
                    </label>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {CAMPUS_PRESETS.map((preset) => {
                        const isSelected = settings.background_image_url === preset.url;
                        return (
                          <div
                            key={preset.name}
                            onClick={() => handlePresetSelect(preset.url)}
                            className={`p-2 rounded-3 border d-flex align-items-center gap-2.5 transition-all ${
                              isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-light border-secondary-subtle'
                            }`}
                            style={{ cursor: 'pointer' }}
                          >
                            <img src={preset.url} alt={preset.name} className="rounded-2 object-cover flex-shrink-0" style={{ width: '42px', height: '42px' }} />
                            <div className="flex-grow-1 overflow-hidden">
                              <div className="fw-semibold small text-dark text-truncate d-flex align-items-center gap-1.5">
                                <span>{preset.name}</span>
                                {isSelected && <i className="bi bi-check-circle-fill text-primary ms-auto"></i>}
                              </div>
                              <div className="text-muted small text-truncate" style={{ fontSize: '0.7rem' }}>{preset.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Fields */}
            <div className="col-12 col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-header bg-white py-3 border-bottom">
                  <h6 className="fw-bold mb-0 text-dark">Hero Headlines &amp; Call to Actions</h6>
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold text-uppercase">Top Announcement Pill</label>
                    <input
                      type="text"
                      value={settings.announcement_banner || ''}
                      onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
                      className="form-control bg-light"
                      placeholder="e.g. University Student Representative Council"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold text-uppercase">Badge Tagline</label>
                    <input
                      type="text"
                      required
                      value={settings.badge_text}
                      onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })}
                      className="form-control bg-light fw-semibold"
                      placeholder="e.g. University Student Representative Council"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold text-uppercase">Main Headline</label>
                    <textarea
                      rows={2}
                      required
                      value={settings.hero_title}
                      onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                      className="form-control bg-light fw-bold"
                      placeholder="Headline..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted small fw-semibold text-uppercase">Subtitle Description</label>
                    <textarea
                      rows={3}
                      required
                      value={settings.hero_subtitle}
                      onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                      className="form-control bg-light"
                      placeholder="Subtitle..."
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted small fw-semibold text-uppercase">Primary CTA Text</label>
                      <input
                        type="text"
                        value={settings.cta_primary_text || 'Get Started'}
                        onChange={(e) => setSettings({ ...settings, cta_primary_text: e.target.value })}
                        className="form-control bg-light"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted small fw-semibold text-uppercase">Secondary CTA Text</label>
                      <input
                        type="text"
                        value={settings.cta_secondary_text || 'Transparency Feed'}
                        onChange={(e) => setSettings({ ...settings, cta_secondary_text: e.target.value })}
                        className="form-control bg-light"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SECTIONS VISIBILITY (1-CLICK DELETE & RESTORE) */}
        {activeTab === 'sections' && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0 text-dark">Section Deletion &amp; Visibility Controls</h6>
            </div>
            <div className="card-body p-4">
              <p className="text-muted small mb-4">
                Administrators can delete or restore any of the 7 sections of the university landing page with a single click. Deleted sections are immediately removed from the live site.
              </p>

              <div className="d-flex flex-column gap-3">
                {[
                  { key: 'announcement', name: 'Announcement Bar', desc: 'Top marquee banner with alert pill' },
                  { key: 'hero', name: 'Hero Headline & Description', desc: 'Main headline, badge, and CTA action buttons' },
                  { key: 'stats', name: 'Vital Statistics Section', desc: 'Key institutional metric badges and numbers' },
                  { key: 'features', name: 'Core Pillars & Capabilities', desc: 'Accountability feature cards and descriptions' },
                  { key: 'governance', name: 'Council Executive Leadership', desc: 'Elected student representative profile cards' },
                  { key: 'faq', name: 'Student Support FAQs', desc: 'Collapsible accordion answers to common questions' },
                  { key: 'footer', name: 'Institutional Footer & Contacts', desc: 'Contact details and council mission statement' },
                ].map((sec) => {
                  const isVisible = settings.sections_visibility?.[sec.key as keyof NonNullable<LandingPageSettings['sections_visibility']>] !== false;
                  return (
                    <div
                      key={sec.key}
                      className="p-3.5 rounded-3 border d-flex align-items-center justify-content-between"
                      style={{
                        backgroundColor: isVisible ? '#F8FAFC' : '#FEF2F2',
                        borderColor: isVisible ? '#E2E8F0' : '#FECACA',
                      }}
                    >
                      <div>
                        <strong className="text-dark d-block">{sec.name}</strong>
                        <span className="text-muted small">{sec.desc}</span>
                      </div>

                      <div>
                        {isVisible ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSettings((prev) => ({
                                ...prev,
                                sections_visibility: {
                                  ...(prev.sections_visibility || {}),
                                  [sec.key]: false,
                                },
                              }));
                            }}
                            className="btn btn-sm btn-outline-danger rounded-pill px-3.5 d-flex align-items-center gap-1.5"
                          >
                            <i className="bi bi-trash"></i>
                            <span>Delete Section</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSettings((prev) => ({
                                ...prev,
                                sections_visibility: {
                                  ...(prev.sections_visibility || {}),
                                  [sec.key]: true,
                                },
                              }));
                            }}
                            className="btn btn-sm btn-success rounded-pill px-3.5 d-flex align-items-center gap-1.5"
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
          </div>
        )}

        {/* TAB 3: STATS (ADD, EDIT, DELETE) */}
        {activeTab === 'stats' && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0 text-dark">Institutional Metric Statistics</h6>
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
                  setSettings((prev) => ({
                    ...prev,
                    stats_items: [...(prev.stats_items || []), newStat],
                  }));
                }}
                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1.5"
                style={{ backgroundColor: '#1176BC' }}
              >
                <i className="bi bi-plus-circle"></i>
                <span>Add New Stat</span>
              </button>
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                {(settings.stats_items || []).map((st, idx) => (
                  <div key={st.id} className="p-3 bg-light rounded-3 border">
                    <div className="row g-2 align-items-center">
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Label</label>
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) => {
                            const updated = [...(settings.stats_items || [])];
                            updated[idx].label = e.target.value;
                            setSettings({ ...settings, stats_items: updated });
                          }}
                          className="form-control form-control-sm"
                        />
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Value</label>
                        <input
                          type="text"
                          value={st.value}
                          onChange={(e) => {
                            const updated = [...(settings.stats_items || [])];
                            updated[idx].value = e.target.value;
                            setSettings({ ...settings, stats_items: updated });
                          }}
                          className="form-control form-control-sm fw-bold text-primary"
                        />
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Icon Class</label>
                        <input
                          type="text"
                          value={st.icon || 'bi-bar-chart'}
                          onChange={(e) => {
                            const updated = [...(settings.stats_items || [])];
                            updated[idx].icon = e.target.value;
                            setSettings({ ...settings, stats_items: updated });
                          }}
                          className="form-control form-control-sm font-monospace"
                        />
                      </div>
                      <div className="col-12 col-md-2 text-end pt-md-3">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (settings.stats_items || []).filter((item) => item.id !== st.id);
                            setSettings({ ...settings, stats_items: updated });
                          }}
                          className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1"
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PILLARS & FEATURES (ADD, EDIT, DELETE) */}
        {activeTab === 'features' && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0 text-dark">Core Pillar Feature Cards</h6>
              <button
                type="button"
                onClick={() => {
                  const newFeat: LandingFeatureItem = {
                    id: `feat-${Date.now()}`,
                    title: 'New Pillar Capability',
                    description: 'Detailed description of this council function...',
                    icon: 'bi-star-fill',
                    badge: 'Active',
                  };
                  setSettings((prev) => ({
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
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                {(settings.features_items || []).map((feat, idx) => (
                  <div key={feat.id} className="p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary rounded-pill">Card #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (settings.features_items || []).filter((f) => f.id !== feat.id);
                          setSettings({ ...settings, features_items: updated });
                        }}
                        className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                      >
                        <i className="bi bi-trash me-1"></i> Delete Card
                      </button>
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-12 col-md-8">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Title</label>
                        <input
                          type="text"
                          value={feat.title}
                          onChange={(e) => {
                            const updated = [...(settings.features_items || [])];
                            updated[idx].title = e.target.value;
                            setSettings({ ...settings, features_items: updated });
                          }}
                          className="form-control form-control-sm fw-semibold"
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Badge</label>
                        <input
                          type="text"
                          value={feat.badge || ''}
                          onChange={(e) => {
                            const updated = [...(settings.features_items || [])];
                            updated[idx].badge = e.target.value;
                            setSettings({ ...settings, features_items: updated });
                          }}
                          className="form-control form-control-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={feat.description}
                        onChange={(e) => {
                          const updated = [...(settings.features_items || [])];
                          updated[idx].description = e.target.value;
                          setSettings({ ...settings, features_items: updated });
                        }}
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LEADERSHIP (ADD, EDIT, DELETE) */}
        {activeTab === 'governance' && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0 text-dark">Council Executive Leadership</h6>
              <button
                type="button"
                onClick={() => {
                  const newLeader: LandingLeaderItem = {
                    id: `lead-${Date.now()}`,
                    name: 'Officer Name',
                    role: 'Representative',
                    faculty: 'Faculty Name',
                    photo_url: '',
                  };
                  setSettings((prev) => ({
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
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                {(settings.leaders_items || []).map((lead, idx) => (
                  <div key={lead.id} className="p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-info-subtle text-info rounded-pill">Leader #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (settings.leaders_items || []).filter((l) => l.id !== lead.id);
                          setSettings({ ...settings, leaders_items: updated });
                        }}
                        className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </div>

                    <div className="row g-2">
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Full Name</label>
                        <input
                          type="text"
                          value={lead.name}
                          onChange={(e) => {
                            const updated = [...(settings.leaders_items || [])];
                            updated[idx].name = e.target.value;
                            setSettings({ ...settings, leaders_items: updated });
                          }}
                          className="form-control form-control-sm fw-semibold"
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Role Title</label>
                        <input
                          type="text"
                          value={lead.role}
                          onChange={(e) => {
                            const updated = [...(settings.leaders_items || [])];
                            updated[idx].role = e.target.value;
                            setSettings({ ...settings, leaders_items: updated });
                          }}
                          className="form-control form-control-sm"
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Faculty Scope</label>
                        <input
                          type="text"
                          value={lead.faculty || ''}
                          onChange={(e) => {
                            const updated = [...(settings.leaders_items || [])];
                            updated[idx].faculty = e.target.value;
                            setSettings({ ...settings, leaders_items: updated });
                          }}
                          className="form-control form-control-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: FAQS (ADD, EDIT, DELETE) */}
        {activeTab === 'faq' && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0 text-dark">Student Support FAQs</h6>
              <button
                type="button"
                onClick={() => {
                  const newFaq: LandingFaqItem = {
                    id: `faq-${Date.now()}`,
                    question: 'New Question?',
                    answer: 'Answer explaining council procedures...',
                  };
                  setSettings((prev) => ({
                    ...prev,
                    faq_items: [...(prev.faq_items || []), newFaq],
                  }));
                }}
                className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-1.5"
                style={{ backgroundColor: '#1176BC' }}
              >
                <i className="bi bi-plus-circle"></i>
                <span>Add FAQ</span>
              </button>
            </div>
            <div className="card-body p-4">
              <div className="d-flex flex-column gap-3">
                {(settings.faq_items || []).map((faq, idx) => (
                  <div key={faq.id} className="p-3 bg-light rounded-3 border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-secondary rounded-pill">Question #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (settings.faq_items || []).filter((f) => f.id !== faq.id);
                          setSettings({ ...settings, faq_items: updated });
                        }}
                        className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-0.5"
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </div>

                    <div className="mb-2">
                      <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Question</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...(settings.faq_items || [])];
                          updated[idx].question = e.target.value;
                          setSettings({ ...settings, faq_items: updated });
                        }}
                        className="form-control form-control-sm fw-semibold"
                      />
                    </div>

                    <div>
                      <label className="form-label text-muted small fw-semibold text-uppercase mb-1">Answer</label>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...(settings.faq_items || [])];
                          updated[idx].answer = e.target.value;
                          setSettings({ ...settings, faq_items: updated });
                        }}
                        className="form-control form-control-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FOOTER & CONTACT */}
        {activeTab === 'footer' && (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white py-3 border-bottom">
              <h6 className="fw-bold mb-0 text-dark">Institutional Footer &amp; Contact Details</h6>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label text-muted small fw-semibold text-uppercase">Footer Statement / Copyright</label>
                <textarea
                  rows={3}
                  value={settings.footer_text || ''}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  className="form-control bg-light"
                />
              </div>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted small fw-semibold text-uppercase">Institutional Email</label>
                  <input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    className="form-control bg-light"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted small fw-semibold text-uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={settings.contact_phone || ''}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    className="form-control bg-light"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save & Publish Button Bar */}
        <div className="d-flex justify-content-end mb-5">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary btn-lg rounded-pill px-5 shadow fw-bold d-flex align-items-center gap-2"
            style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
          >
            {isSaving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Publishing All Sections...</span>
              </>
            ) : (
              <>
                <i className="bi bi-cloud-arrow-up-fill fs-5"></i>
                <span>Publish &amp; Save All Sections</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
