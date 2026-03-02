import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function Navbar({ teamName }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        height: 56,
        background: 'var(--bg-secondary)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left: Logo + breadcrumb */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-blue, #3b82f6) 0%, var(--accent-violet, #6366f1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
            flexShrink: 0,
          }}
        >
          O
        </div>
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          OpsBoard
        </span>

        {teamName && (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted, rgba(255,255,255,0.2))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {teamName}
            </span>
          </>
        )}
      </div>

      {/* Right: live indicator + theme switcher + user */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Live */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 99,
            padding: '0.2rem 0.65rem',
          }}
        >
          <span className="live-dot" />
          <span className="nav-live-label" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#34d399', letterSpacing: '0.04em' }}>
            LIVE
          </span>
        </div>

        {/* Theme Switcher */}
        {/* <ThemeSwitcher /> */}

        {/* User avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#fff',
              border: '1.5px solid var(--border-color)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <span
            className="nav-username"
            style={{
              fontSize: '0.82rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            fontSize: '0.78rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.3rem 0.5rem',
            borderRadius: 6,
          }}
          onMouseEnter={(e) => (e.target.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.target.style.color = 'var(--text-secondary)')}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}