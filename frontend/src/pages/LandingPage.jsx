import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

/* ── Floating particle canvas ── */
function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 70;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,250,${p.alpha})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(99,179,250,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.55,
      }}
    />
  );
}

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Real-Time Sync',
    desc: 'Every update is live. WebSocket-powered synchronization keeps everyone in the same moment.',
    accent: 'rgba(59,130,246,0.7)',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    ),
    title: 'Kanban Command',
    desc: 'Four-column flow: Todo → Active → Done → Blocked. Visual clarity at every stage.',
    accent: 'rgba(139,92,246,0.7)',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    title: 'Blocker Intelligence',
    desc: 'Surface blockers instantly. Your team\'s execution risk scored in real time.',
    accent: 'rgba(245,158,11,0.7)',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Execution Analytics',
    desc: 'Completion rate, momentum, overdue signals. Every metric you need to ship.',
    accent: 'rgba(16,185,129,0.7)',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Team Roles',
    desc: 'Admin controls and member permissions. Structured accountability at every level.',
    accent: 'rgba(6,182,212,0.7)',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
    title: 'Instant Invites',
    desc: '8-character code. Share it anywhere. Your team is inside in under a minute.',
    accent: 'rgba(236,72,153,0.7)',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,130,246,0.14) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.10) 0%, transparent 60%), #030712',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ParticleCanvas />

      {/* ── NAV ── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 2.5rem',
          position: 'relative',
          zIndex: 10,
          borderBottom: '1px solid rgba(255,255,255,0.045)',
          backdropFilter: 'blur(16px)',
          background: 'rgba(3,7,18,0.6)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 0 16px rgba(59,130,246,0.5)',
              letterSpacing: '-0.5px',
            }}
          >
            O
          </div>
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            OpsBoard
          </span>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary"
            style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary"
            style={{ padding: '0.45rem 1.2rem', fontSize: '0.82rem' }}
          >
            Get started free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '5rem 1.5rem 4rem', position: 'relative', zIndex: 5 }}>

        {/* Eyebrow pill */}
        <div
          className="animate-fade-up"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 99,
            padding: '0.3rem 1rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#93c5fd',
            letterSpacing: '0.04em',
            marginBottom: '2rem',
          }}
        >
          <span className="live-dot" />
          Real-time • Hackathon-ready • Elite teams
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-up stagger-1"
          style={{
            fontSize: 'clamp(2.8rem, 6vw, 5rem)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
            maxWidth: '820px',
          }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 40%, #93c5fd 80%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            The command center
            <br />for elite teams.
          </span>
        </h1>

        {/* Sub */}
        <p
          className="animate-fade-up stagger-2"
          style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: '520px',
            lineHeight: 1.7,
            marginBottom: '2.5rem',
            fontWeight: 400,
          }}
        >
          Precision task management, live execution risk scoring,
          and AI-generated standups — built for teams that ship.
        </p>

        {/* CTA buttons */}
        <div className="animate-fade-up stagger-3" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary"
            style={{
              fontSize: '0.95rem',
              padding: '0.75rem 2rem',
              borderRadius: 12,
              boxShadow: '0 0 32px rgba(59,130,246,0.35), 0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            Launch your team
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="btn-secondary"
            style={{ fontSize: '0.95rem', padding: '0.75rem 1.75rem', borderRadius: 12 }}
          >
            Sign in
          </button>
        </div>

        {/* Social proof strip */}
        <div
          className="animate-fade-up stagger-4"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            marginTop: '3rem',
            color: 'rgba(255,255,255,0.28)',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          <span>Built for hackathons</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <span>WebSocket-live</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
          <span>Low latency</span>
        </div>

        {/* ── FEATURES GRID ── */}
        <div
          style={{
            marginTop: '6rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
            maxWidth: '920px',
            width: '100%',
            textAlign: 'left',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`animate-fade-up stagger-${Math.min(i + 1, 6)}`}
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: '1.25rem',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.045)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 0 30px ${f.accent.replace('0.7','0.12')}, 0 12px 40px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Accent glow */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 60, height: 60,
                background: `radial-gradient(circle, ${f.accent.replace('0.7','0.15')} 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Icon */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: f.accent.replace('0.7','0.12'),
                  border: `1px solid ${f.accent.replace('0.7','0.2')}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: f.accent.replace('rgba(', 'rgb(').replace(/,[\d.]+\)/, ')'),
                  marginBottom: '0.875rem',
                }}
              >
                {f.icon}
              </div>

              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'rgba(255,255,255,0.88)', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.78rem',
          position: 'relative',
          zIndex: 5,
          fontWeight: 500,
          letterSpacing: '0.04em',
        }}
      >
        OPSBOARD · COMMANDCENTER · 2026
      </footer>
    </div>
  );
}
