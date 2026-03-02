import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState('');
  // When backend says email is unverified:
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('idle'); // idle | loading | done

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverifiedEmail('');
    setResendStatus('idle');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.unverified) {
        setUnverifiedEmail(err.response.data.email || form.email);
      } else {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('loading');
    try {
      await authAPI.resendVerification({ email: unverifiedEmail });
      setResendStatus('done');
    } catch {
      setResendStatus('idle');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse 80% 80% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 90% 90%, rgba(139,92,246,0.08) 0%, transparent 50%), var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(80px)' }} />
      </div>

      <div className="animate-scale-in" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 5 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 1rem',
              borderRadius: 15,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 30px rgba(59,130,246,0.4), 0 8px 24px rgba(0,0,0,0.4)',
              letterSpacing: '-1px',
            }}
          >
            O
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.92)', marginBottom: '0.35rem' }}>
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}>
            Sign in to your command center
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '2rem',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField('')}
                placeholder="you@company.com"
                className="input-field"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '0.4rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField('')}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10,
                  padding: '0.625rem 0.875rem',
                  fontSize: '0.82rem',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Unverified email notice */}
            {unverifiedEmail && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.75rem 0.875rem', fontSize: '0.82rem', color: '#fbbf24' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Email not verified. Please check your inbox.
                </div>
                {resendStatus === 'done' ? (
                  <p style={{ margin: 0, color: '#34d399', fontSize: '0.78rem' }}>New verification email sent!</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendStatus === 'loading'}
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 7, color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', cursor: 'pointer' }}
                  >
                    {resendStatus === 'loading' ? 'Sending…' : 'Resend verification email'}
                  </button>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                borderRadius: 12,
                marginTop: '0.25rem',
                justifyContent: 'center',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Signing in…
                </span>
              ) : (
                'Sign in to OpsBoard'
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
          No account?{' '}
          <Link
            to="/register"
            style={{ color: '#93c5fd', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.target.style.color = '#60a5fa')}
            onMouseLeave={(e) => (e.target.style.color = '#93c5fd')}
          >
            Create one free →
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

