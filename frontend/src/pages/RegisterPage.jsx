import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successEmail, setSuccessEmail] = useState(''); // non-empty = show success screen
  const [resendStatus, setResendStatus] = useState('idle'); // idle | loading | done

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus('loading');
    try {
      await authAPI.resendVerification({ email: successEmail });
      setResendStatus('done');
    } catch {
      setResendStatus('idle');
    }
  };

  // NOTE: InputField intentionally inlined below — defining it here as a
  // component would recreate it on every render, losing focus after each keystroke.

  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '0.4rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  // ── Success screen: email verification sent ──────────────────────────────
  if (successEmail) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%), var(--bg-primary)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '5%', right: '10%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(80px)' }} />
        </div>
        <div className="animate-scale-in" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 5, textAlign: 'center' }}>
          {/* Logo */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ width: 52, height: 52, margin: '0 auto 1rem', borderRadius: 15, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: '#fff', boxShadow: '0 0 28px rgba(139,92,246,0.4), 0 8px 24px rgba(0,0,0,0.4)' }}>O</div>
          </div>
          {/* Card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '2.5rem 2rem', backdropFilter: 'blur(24px)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
            {/* Mail icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
            </div>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.04em' }}>
              Check your inbox
            </h1>
            <p style={{ margin: '0 0 0.375rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              We sent a verification link to
            </p>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
              {successEmail}
            </p>
            <p style={{ margin: '0 0 1.75rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              Click the link in the email to activate your account. The link expires in&nbsp;
              <strong style={{ color: 'rgba(255,255,255,0.45)' }}>24 hours</strong>.
            </p>
            {/* Resend */}
            {resendStatus === 'done' ? (
              <p style={{ fontSize: '0.82rem', color: '#34d399' }}>New verification email sent!</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendStatus === 'loading'}
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, color: '#a78bfa', fontSize: '0.82rem', fontWeight: 600, padding: '0.5rem 1.25rem', cursor: 'pointer', transition: 'all 0.15s' }}
              >
                {resendStatus === 'loading' ? 'Sending…' : 'Resend verification email'}
              </button>
            )}
          </div>
          <p style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
            Already verified?{' '}
            <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 10% 90%, rgba(59,130,246,0.08) 0%, transparent 50%), var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '5%', right: '10%', width: 380, height: 380, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(70px)' }} />
      </div>

      <div className="animate-scale-in" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 5 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 1rem',
              borderRadius: 15,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 28px rgba(139,92,246,0.4), 0 8px 24px rgba(0,0,0,0.4)',
              letterSpacing: '-1px',
            }}
          >
            O
          </div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'rgba(255,255,255,0.92)', marginBottom: '0.3rem' }}>
            Join OpsBoard
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.36)', fontWeight: 400 }}>
            Your team's command center · Up and running in seconds
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Alex Rivera"
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="input-field"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="min 6 chars"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Confirm</label>
                <input
                  type="password"
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  placeholder="repeat"
                  className="input-field"
                  required
                />
              </div>
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
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: '1px solid rgba(139,92,246,0.4)',
                boxShadow: loading ? 'none' : '0 0 20px rgba(139,92,246,0.3)',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Creating account…
                </span>
              ) : (
                'Create free account'
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={(e) => (e.target.style.color = '#c4b5fd')}
            onMouseLeave={(e) => (e.target.style.color = '#a78bfa')}
          >
            Sign in →
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

