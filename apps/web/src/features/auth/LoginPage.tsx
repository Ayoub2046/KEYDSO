import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

/* ─── Floating Orb Background (pure CSS animation) ─── */
const FloatingOrbs: React.FC = () => (
  <div
    aria-hidden="true"
    style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
  >
    {/* Large primary orb — top-left */}
    <div
      style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '55vw',
        height: '55vw',
        maxWidth: '700px',
        maxHeight: '700px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(17,118,188,0.22) 0%, rgba(37,168,224,0.10) 55%, transparent 75%)',
        animation: 'orbFloat1 18s ease-in-out infinite',
      }}
    />
    {/* Medium cyan orb — bottom-right */}
    <div
      style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-8%',
        width: '45vw',
        height: '45vw',
        maxWidth: '560px',
        maxHeight: '560px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(37,168,224,0.18) 0%, rgba(17,118,188,0.08) 60%, transparent 80%)',
        animation: 'orbFloat2 14s ease-in-out infinite',
      }}
    />
    {/* Small accent orb — center-right */}
    <div
      style={{
        position: 'absolute',
        top: '40%',
        right: '20%',
        width: '20vw',
        height: '20vw',
        maxWidth: '280px',
        maxHeight: '280px',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, rgba(159,187,222,0.14) 0%, transparent 70%)',
        animation: 'orbFloat3 22s ease-in-out infinite',
      }}
    />
    <style>{`
      @keyframes orbFloat1 {
        0%,100% { transform: translate(0,0) scale(1); }
        33%      { transform: translate(4%,6%) scale(1.07); }
        66%      { transform: translate(-3%,3%) scale(0.95); }
      }
      @keyframes orbFloat2 {
        0%,100% { transform: translate(0,0) scale(1); }
        40%      { transform: translate(-5%,-4%) scale(1.1); }
        75%      { transform: translate(3%,2%) scale(0.93); }
      }
      @keyframes orbFloat3 {
        0%,100% { transform: translate(0,0); }
        50%      { transform: translate(-6%,8%); }
      }
    `}</style>
  </div>
);

/* ─── Top Grid Lines (subtle) ─── */
const GridLines: React.FC = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: '60px 60px',
    }}
  />
);

export const LoginPage: React.FC = () => {
  const [accessType, setAccessType] = useState<'student' | 'council'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger mount animation
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const session = await api.login({ email: identifier.trim(), password });
      setSession(session.access_token, {
        ...session.user,
        roles: session.roles,
        assigned_faculty_id: session.assigned_faculty_id,
      });

      if (session.roles?.includes('STUDENT') && session.roles.length === 1) {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (accessType === 'student'
            ? 'Invalid Student ID or password. Default password = your Student ID.'
            : 'Invalid institutional email address or password.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isStudent = accessType === 'student';
  const accentColor = isStudent ? '#10B981' : '#25A8E0';
  const accentGlow = isStudent
    ? 'rgba(16,185,129,0.35)'
    : 'rgba(37,168,224,0.35)';

  /* ─── Shared input style ─── */
  const inputBaseStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255,255,255,0.055)',
    border: '1.5px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    color: '#E8F4FD',
    fontSize: '0.9rem',
    padding: '12px 14px 12px 48px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s',
    backdropFilter: 'blur(4px)',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = accentColor;
    e.target.style.boxShadow = `0 0 0 3px ${accentGlow}`;
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.12)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <>
      {/* ── Page shell: deep navy ── */}
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #060E1C 0%, #0B2545 50%, #0A1C3A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          padding: '24px 16px',
        }}
      >
        <FloatingOrbs />
        <GridLines />

        {/* Back link — top left */}
        <Link
          to="/"
          style={{
            position: 'fixed',
            top: '20px',
            left: '24px',
            color: 'rgba(255,255,255,0.55)',
            textDecoration: 'none',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color = '#25A8E0')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              'rgba(255,255,255,0.55)')
          }
        >
          <i className="bi bi-arrow-left" />
          <span>Back to Home</span>
        </Link>

        {/* Version badge — top right */}
        <span
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.75rem',
            zIndex: 10,
          }}
        >
          Keydso Maanta v2.0
        </span>

        {/* ═══════════════════════════════════════════════════════
            MAIN GLASS CARD
            ═══════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            zIndex: 5,
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(10, 25, 55, 0.72)',
            backdropFilter: 'blur(28px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow:
              '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.12) inset',
            padding: '44px 40px 36px',
            transition: 'opacity 0.5s, transform 0.5s',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(18px)',
          }}
        >
          {/* ── Top accent line (matches active tab color) ── */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '12%',
              right: '12%',
              height: '2.5px',
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              borderRadius: '0 0 4px 4px',
              transition: 'background 0.4s',
            }}
          />

          {/* ── Shield Icon ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accentColor}30, ${accentColor}10)`,
                border: `2px solid ${accentColor}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 24px ${accentGlow}, 0 0 60px ${accentGlow.replace('0.35', '0.15')}`,
                transition: 'all 0.4s',
              }}
            >
              <i
                className="bi bi-shield-lock-fill"
                style={{ fontSize: '2rem', color: accentColor, transition: 'color 0.4s' }}
              />
            </div>
          </div>

          {/* ── Brand Title ── */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <h1
              style={{
                color: '#FFFFFF',
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              KEYDSO MAANTA
            </h1>
            <p
              style={{
                color: 'rgba(159,187,222,0.75)',
                fontSize: '0.75rem',
                margin: '4px 0 0',
                letterSpacing: '0.03em',
              }}
            >
              University Student Representative Council
            </p>
          </div>

          {/* ── Tab Switcher — Student | Council ── */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
              padding: '5px',
              margin: '20px 0 24px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {(['student', 'council'] as const).map((type) => {
              const active = accessType === type;
              const tabAccent = type === 'student' ? '#10B981' : '#25A8E0';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setAccessType(type);
                    setErrorMessage(null);
                    setIdentifier('');
                    setPassword('');
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    transition: 'all 0.3s',
                    background: active
                      ? `linear-gradient(135deg, ${tabAccent}22, ${tabAccent}10)`
                      : 'transparent',
                    color: active ? tabAccent : 'rgba(159,187,222,0.6)',
                    boxShadow: active
                      ? `0 0 12px ${tabAccent}30, inset 0 0 0 1px ${tabAccent}40`
                      : 'none',
                  }}
                >
                  <i
                    className={
                      type === 'student'
                        ? 'bi bi-mortarboard-fill'
                        : 'bi bi-shield-fill'
                    }
                    style={{ fontSize: '0.95rem' }}
                  />
                  {type === 'student' ? 'Student Portal' : 'Council & Staff'}
                </button>
              );
            })}
          </div>

          {/* ── Motto badge ── */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '28px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.72rem',
                color: accentColor,
                fontWeight: 600,
                letterSpacing: '0.03em',
                transition: 'all 0.4s',
              }}
            >
              {isStudent ? '🎓 Student Access Portal' : '🛡️ Council & Staff Access'}
            </span>
          </div>

          {/* ── Error Alert ── */}
          {errorMessage && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220,38,38,0.4)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                color: '#FCA5A5',
                fontSize: '0.83rem',
              }}
            >
              <i className="bi bi-exclamation-triangle-fill" style={{ marginTop: '1px', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit}>
            {/* Identifier */}
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  color: 'rgba(159,187,222,0.8)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                {isStudent ? 'Student ID Number' : 'Institutional Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                {/* Icon */}
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: accentColor,
                    fontSize: '1rem',
                    pointerEvents: 'none',
                    zIndex: 2,
                    transition: 'color 0.4s',
                  }}
                >
                  <i className={`bi ${isStudent ? 'bi-person-badge-fill' : 'bi-envelope-fill'}`} />
                </span>
                <input
                  type={isStudent ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={isStudent ? 'Student ID Number' : 'Institutional Email Address'}
                  autoComplete="username"
                  style={inputBaseStyle}
                />
              </div>
              {isStudent && (
                <p
                  style={{
                    color: 'rgba(159,187,222,0.5)',
                    fontSize: '0.7rem',
                    margin: '5px 0 0',
                  }}
                >
                  Enter your university-issued Student ID number.
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <label
                  style={{
                    color: 'rgba(159,187,222,0.8)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: accentColor,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    transition: 'opacity 0.2s',
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                {/* Key icon */}
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: accentColor,
                    fontSize: '1rem',
                    pointerEvents: 'none',
                    zIndex: 2,
                    transition: 'color 0.4s',
                  }}
                >
                  <i className="bi bi-key-fill" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{ ...inputBaseStyle, paddingRight: '48px' }}
                />
                {/* Eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'rgba(159,187,222,0.6)',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    zIndex: 2,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = accentColor)
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color =
                      'rgba(159,187,222,0.6)')
                  }
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`} />
                </button>
              </div>
              {isStudent && (
                <p
                  style={{
                    color: '#10B981',
                    fontSize: '0.7rem',
                    margin: '5px 0 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <i className="bi bi-info-circle-fill" />
                  Default password is your Student ID number.
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                margin: '16px 0 24px',
              }}
            >
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: accentColor,
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="rememberMe"
                style={{
                  color: 'rgba(159,187,222,0.65)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Remember this device for 7 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                background: isStudent
                  ? 'linear-gradient(135deg, #059669, #10B981, #34D399)'
                  : 'linear-gradient(135deg, #1176BC, #25A8E0, #60C6F0)',
                color: '#FFFFFF',
                boxShadow: `0 6px 24px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.3)`,
                opacity: isLoading ? 0.75 : 1,
                transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.3s',
                transform: 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 10px 32px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.3)`;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 24px ${accentGlow}, 0 2px 8px rgba(0,0,0,0.3)`;
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2.5px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.75s linear infinite',
                    }}
                  />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right" style={{ fontSize: '1.1rem' }} />
                  <span>
                    {isStudent ? 'Sign In to Student Portal' : 'Sign In to Council Portal'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* ── Help link ── */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
              color: 'rgba(159,187,222,0.55)',
              fontSize: '0.78rem',
            }}
          >
            First time signing in?{' '}
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: accentColor,
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Read the Access Guide →
            </button>
          </div>

          {/* ── SSL Badge ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(159,187,222,0.4)',
              fontSize: '0.72rem',
            }}
          >
            <i className="bi bi-lock-fill text-success" style={{ color: '#10B981' }} />
            <span>SSL 256-bit Encrypted · Secure Institutional Login</span>
          </div>

          {/* ── Copyright ── */}
          <p
            style={{
              textAlign: 'center',
              color: 'rgba(159,187,222,0.3)',
              fontSize: '0.68rem',
              marginTop: '10px',
              marginBottom: 0,
            }}
          >
            © {new Date().getFullYear()} University Student Representative Council
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          HELP MODAL
          ═══════════════════════════════════════════════════════ */}
      {showHelpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1060,
            background: 'rgba(2, 8, 20, 0.80)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHelpModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              background: 'rgba(10, 25, 55, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
              overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '20px 24px 18px',
                background: 'rgba(17,118,188,0.15)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(37,168,224,0.2)',
                    border: '1px solid rgba(37,168,224,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#25A8E0',
                  }}
                >
                  <i className="bi bi-question-circle-fill" />
                </div>
                <h5
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    margin: 0,
                  }}
                >
                  Portal Access & Password Guide
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '1rem',
                }}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px' }}>
              {/* Students */}
              <div style={{ marginBottom: '20px' }}>
                <h6
                  style={{
                    color: '#10B981',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    marginBottom: '10px',
                  }}
                >
                  <i className="bi bi-mortarboard-fill" />
                  For University Students
                </h6>
                <p style={{ color: 'rgba(159,187,222,0.75)', fontSize: '0.83rem', margin: '0 0 10px' }}>
                  All enrolled students have an active portal account created during registration.
                </p>
                <ul
                  style={{
                    color: 'rgba(159,187,222,0.75)',
                    fontSize: '0.83rem',
                    paddingLeft: '18px',
                    margin: 0,
                    lineHeight: '1.8',
                  }}
                >
                  <li>
                    <strong style={{ color: '#E8F4FD' }}>Username:</strong> Your Student ID (e.g.{' '}
                    <code
                      style={{
                        background: 'rgba(37,168,224,0.15)',
                        color: '#25A8E0',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      cis231660
                    </code>
                    )
                  </li>
                  <li>
                    <strong style={{ color: '#E8F4FD' }}>Initial Password:</strong> Same as your Student ID.
                  </li>
                  <li>After first login, change your password in your profile settings.</li>
                </ul>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: '18px',
                  marginBottom: '18px',
                }}
              >
                <h6
                  style={{
                    color: '#25A8E0',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    marginBottom: '10px',
                  }}
                >
                  <i className="bi bi-shield-lock-fill" />
                  For Council Officers & Staff
                </h6>
                <p style={{ color: 'rgba(159,187,222,0.75)', fontSize: '0.83rem', margin: 0 }}>
                  Use your assigned institutional email (e.g.{' '}
                  <code
                    style={{
                      background: 'rgba(37,168,224,0.15)',
                      color: '#25A8E0',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                    }}
                  >
                    admin@keydso.university.edu
                  </code>
                  ) and your secure password.
                </p>
              </div>

              {/* Support box */}
              <div
                style={{
                  background: 'rgba(37,168,224,0.08)',
                  border: '1px solid rgba(37,168,224,0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: 'rgba(159,187,222,0.75)',
                  fontSize: '0.8rem',
                }}
              >
                <i className="bi bi-telephone-inbound-fill" style={{ color: '#25A8E0', marginTop: '1px', flexShrink: 0 }} />
                <span>
                  Still having issues? Contact the IT Desk at{' '}
                  <code
                    style={{
                      background: 'rgba(37,168,224,0.15)',
                      color: '#25A8E0',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    support@keydso.university.edu
                  </code>
                </span>
              </div>
            </div>

            {/* Modal footer */}
            <div
              style={{
                padding: '14px 24px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  padding: '9px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #1176BC, #25A8E0)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 14px rgba(37,168,224,0.35)',
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        input::placeholder { color: rgba(159,187,222,0.35) !important; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(10,25,55,0.9) inset !important;
          -webkit-text-fill-color: #E8F4FD !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
      `}</style>
    </>
  );
};
