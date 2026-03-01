import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const CheckCircleIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const MailIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const SpinnerIcon = () => (
  <div style={{
    width: 52, height: 52, borderRadius: '50%',
    border: '3px solid rgba(139,92,246,0.2)',
    borderTopColor: '#8b5cf6',
    animation: 'spin 0.8s linear infinite',
  }} />
);

// ─── Resend form ──────────────────────────────────────────────────────────────
function ResendForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [msg, setMsg] = useState('');

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const { data } = await authAPI.resendVerification({ email });
      setMsg(data.message);
      setStatus('done');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to resend. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: '1rem' }}>
        {msg}
      </p>
    );
  }

  return (
    <form onSubmit={handleResend} style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        Didn&apos;t receive it, or link expired?
      </p>
      {status === 'error' && (
        <p style={{ fontSize: '0.78rem', color: '#f87171', textAlign: 'center' }}>{msg}</p>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="input-field"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '0 1rem',
            borderRadius: 10,
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s',
          }}
        >
          {status === 'loading' ? 'Sending…' : 'Resend'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    authAPI
      .verifyEmail(token)
      .then(({ data }) => {
        setMessage(data.message);
        setStatus('success');
      })
      .catch((err) => {
        setMessage(
          err.response?.data?.message ||
            'Verification failed. The link may have expired.'
        );
        setStatus('error');
      });
  }, [searchParams]);

  // ── Shared layout shell ───────────────────────────────────────────────────
  const shell = (content) => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background:
          'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%), #030712',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 320, height: 320, borderRadius: '50%', background: 'rgba(139,92,246,0.07)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '5%', width: 260, height: 260, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(70px)' }} />
      </div>

      <div className="animate-scale-in" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 5 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, margin: '0 auto 1rem', borderRadius: 15,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.3rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 28px rgba(139,92,246,0.4), 0 8px 24px rgba(0,0,0,0.4)',
            letterSpacing: '-1px',
          }}>O</div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>OpsBoard</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '2.5rem 2rem',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          textAlign: 'center',
        }}>
          {content}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── States ────────────────────────────────────────────────────────────────
  if (status === 'verifying') {
    return shell(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <SpinnerIcon />
        <p style={{ margin: 0, fontSize: '1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          Verifying your email…
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return shell(
      <>
        <div style={{ color: '#34d399', marginBottom: '1rem' }}>
          <CheckCircleIcon />
        </div>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.04em' }}>
          Email verified!
        </h1>
        <p style={{ margin: '0 0 1.75rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          {message}
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            padding: '0.7rem 2.5rem',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 0 20px rgba(139,92,246,0.3)',
            transition: 'opacity 0.15s',
          }}
        >
          Go to login →
        </Link>
      </>
    );
  }

  // error state
  return shell(
    <>
      <div style={{ color: '#f87171', marginBottom: '1rem' }}>
        <XCircleIcon />
      </div>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.04em' }}>
        Verification failed
      </h1>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
        {message}
      </p>
      <ResendForm />
      <p style={{ marginTop: '1.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.25)' }}>
        <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>Back to login</Link>
      </p>
    </>
  );
}
