import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { LandingPageSettings } from '@keydso/shared-types';

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
  hero_subtitle: 'A modern platform to manages student contributions, representatives, activities and university affairs with full transparency and trust.',
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
  announcement_banner: 'University Student Representative Council &bull; Semester 2 Contributions Live',
};

export const LandingPageCustomizer: React.FC = () => {
  const [settings, setSettings] = useState<LandingPageSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      const updated = await api.updateLandingSettings(settings);
      setSettings(updated);
      setSuccessMessage('Landing page background and content updated successfully! Live on the homepage immediately.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update landing page settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all landing page texts and background to official university defaults?')) {
      setUploadedFileName(null);
      setSettings(DEFAULT_SETTINGS);
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
            <h3 className="fw-bold mb-0 text-dark">Landing Page &amp; Background Customizer</h3>
            <span className="badge bg-primary text-white rounded-pill" style={{ backgroundColor: '#1176BC' }}>
              Admin CMS
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Upload custom background images, customize hero headlines, metrics, and institutional features.
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

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Left Column: Background Image Selector & Live Preview */}
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 sticky-lg-top" style={{ top: '80px' }}>
              <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                  <i className="bi bi-image text-km-primary"></i>
                  <span>Landing Background Image</span>
                </h5>
                <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small">
                  Live Preview
                </span>
              </div>

              <div className="card-body p-3">
                {/* Live Preview of Background with Overlay */}
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
                    <span className="badge bg-success rounded-pill mb-1.5 small" style={{ fontSize: '0.68rem', backgroundColor: '#10B981' }}>
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

                {/* 1. Upload Custom Image from Computer File Input */}
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
                      style={{ width: '44px', height: '44px', backgroundColor: '#1176BC' }}
                    >
                      <i className="bi bi-cloud-arrow-up fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-bold small text-dark">Upload Background from Computer</div>
                      <div className="text-muted small" style={{ fontSize: '0.74rem' }}>
                        Supports JPG, PNG, WebP up to 8MB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-primary btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm mt-1"
                      style={{ backgroundColor: '#1176BC', borderColor: '#1176BC' }}
                    >
                      <i className="bi bi-folder2-open"></i>
                      <span>Choose Image File</span>
                    </button>
                    {uploadedFileName && (
                      <div className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small mt-1">
                        <i className="bi bi-check-circle me-1"></i>
                        Uploaded: {uploadedFileName}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Custom Image URL input */}
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                    Or Enter Direct Image URL
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-link-45deg"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={settings.background_image_url}
                      onChange={(e) => {
                        setUploadedFileName(null);
                        setSettings({ ...settings, background_image_url: e.target.value });
                      }}
                      placeholder="e.g. /zamzam_hero.jpg or https://example.com/campus.jpg"
                      className="form-control bg-light border-start-0 ps-0 font-monospace small"
                    />
                  </div>
                  <div className="form-text" style={{ fontSize: '0.72rem' }}>
                    You can use local assets (<code>/zamzam_hero.jpg</code>) or any external image URL.
                  </div>
                </div>

                {/* 3. Background Overlay Darkness Slider */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide mb-0">
                      Background Dark Overlay ({Math.round(settings.background_overlay_opacity * 100)}%)
                    </label>
                    <span className="badge bg-light text-dark border small">
                      {settings.background_overlay_opacity}
                    </span>
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
                  <div className="form-text" style={{ fontSize: '0.72rem' }}>
                    Adjusts darkness so text is perfectly readable over university campus photos.
                  </div>
                </div>

                {/* 4. Curated Presets with Zamzam University Photo */}
                <div>
                  <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide mb-2">
                    Curated University Presets:
                  </label>
                  <div className="d-flex flex-column gap-2">
                    {CAMPUS_PRESETS.map((preset) => {
                      const isSelected = settings.background_image_url === preset.url;
                      return (
                        <div
                          key={preset.name}
                          onClick={() => handlePresetSelect(preset.url)}
                          className={`p-2 rounded-3 border d-flex align-items-center gap-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary bg-opacity-10 shadow-sm'
                              : 'bg-light hover-bg-light border-secondary-subtle'
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="rounded-2 object-cover flex-shrink-0"
                            style={{ width: '48px', height: '48px' }}
                          />
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-semibold small text-dark text-truncate d-flex align-items-center gap-1.5">
                              <span>{preset.name}</span>
                              {preset.badge && (
                                <span className="badge bg-success rounded-pill" style={{ fontSize: '0.62rem', backgroundColor: '#10B981' }}>
                                  {preset.badge}
                                </span>
                              )}
                              {isSelected && <i className="bi bi-check-circle-fill text-primary ms-auto" style={{ fontSize: '0.85rem' }}></i>}
                            </div>
                            <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Content, Statistics & Pillars Editor */}
          <div className="col-12 col-lg-7">
            {/* Hero Main Content Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                  <i className="bi bi-card-heading text-km-primary"></i>
                  <span>Hero Header Content</span>
                </h5>
              </div>

              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                    Top Announcement Pill Text
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-megaphone"></i>
                    </span>
                    <input
                      type="text"
                      value={settings.announcement_banner || ''}
                      onChange={(e) => setSettings({ ...settings, announcement_banner: e.target.value })}
                      placeholder="e.g. University Student Representative Council"
                      className="form-control bg-light border-start-0 ps-0"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                    Badge / Tagline
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-patch-check"></i>
                    </span>
                    <input
                      type="text"
                      required
                      value={settings.badge_text}
                      onChange={(e) => setSettings({ ...settings, badge_text: e.target.value })}
                      placeholder="e.g. University Student Representative Council"
                      className="form-control bg-light border-start-0 ps-0 fw-semibold"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                    Main Hero Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                    placeholder="Keydso Maanta Every Contribution Matters. Every Action Is Accountable."
                    className="form-control bg-light fw-bold"
                  />
                  <div className="form-text" style={{ fontSize: '0.72rem' }}>
                    Tip: The last phrase ("Accountable.") is highlighted in emerald green on the landing page.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                    Subtitle Description
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                    placeholder="A modern platform to manages student contributions, representatives, activities..."
                    className="form-control bg-light"
                  />
                </div>
              </div>
            </div>

            {/* Statistics Badges Card */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-white py-3 border-bottom">
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-dark">
                  <i className="bi bi-speedometer text-km-cyan"></i>
                  <span>Landing Page Key Metric Stats</span>
                </h5>
              </div>

              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                      Students Stat
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.stat_students_count}
                      onChange={(e) => setSettings({ ...settings, stat_students_count: e.target.value })}
                      className="form-control bg-light fw-bold"
                      placeholder="8,450"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                      Faculties Stat
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.stat_treasury_amount}
                      onChange={(e) => setSettings({ ...settings, stat_treasury_amount: e.target.value })}
                      className="form-control bg-light fw-bold text-km-primary"
                      placeholder="8 Faculties"
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label text-muted small fw-semibold text-uppercase tracking-wide">
                      Transparency Stat
                    </label>
                    <input
                      type="text"
                      required
                      value={settings.stat_audit_rate}
                      onChange={(e) => setSettings({ ...settings, stat_audit_rate: e.target.value })}
                      className="form-control bg-light fw-bold text-success"
                      placeholder="100% Transparency"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
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
                    <span>Saving Background &amp; Content...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-cloud-arrow-up-fill fs-5"></i>
                    <span>Publish Landing Page Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
