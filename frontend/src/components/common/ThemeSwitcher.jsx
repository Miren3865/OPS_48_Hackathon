import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

const THEME_OPTIONS = [
  {
    id: 'theme-dark',
    label: 'Dark',
    icon: '🌑',
    desc: 'Deep space',
  },
  {
    id: 'theme-light',
    label: 'Light',
    icon: '☀️',
    desc: 'Clean & bright',
  },
  {
    id: 'theme-neon',
    label: 'Neon',
    icon: '⚡',
    desc: 'Cyber glow',
  },
  {
    id: 'theme-midnight',
    label: 'Midnight',
    icon: '🌙',
    desc: 'Slate blue',
  },
];

export default function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Change theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '0.3rem 0.6rem',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          transition: 'border-color 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>{current.icon}</span>
        <span style={{ display: 'none', ...(window.innerWidth > 640 ? { display: 'inline' } : {}) }}>
          {current.label}
        </span>
        {/* Chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '0.4rem',
            minWidth: 170,
            zIndex: 9999,
            boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
            animation: 'scaleIn 0.15s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {THEME_OPTIONS.map((opt) => {
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  changeTheme(opt.id);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
                  borderRadius: 8,
                  padding: '0.45rem 0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--card-bg)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1rem', flexShrink: 0, width: 20, textAlign: 'center' }}>
                  {opt.icon}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {opt.desc}
                  </div>
                </div>
                {isActive && (
                  <svg
                    style={{ marginLeft: 'auto', flexShrink: 0 }}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
