/**
 * ConfirmModal — generic glassmorphism confirmation dialog.
 *
 * Props:
 *   isOpen      {bool}
 *   title       {string}
 *   message     {string|ReactNode}
 *   confirmText {string}   — default "Confirm"
 *   cancelText  {string}   — default "Cancel"
 *   variant     {'default'|'danger'|'success'}
 *   onConfirm   {fn}
 *   onCancel    {fn}
 *   loading     {bool}     — disables buttons while async op is in-flight
 */
export default function ConfirmModal({
  isOpen,
  title       = 'Are you sure?',
  message     = '',
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  variant     = 'default',
  onConfirm,
  onCancel,
  loading     = false,
}) {
  if (!isOpen) return null;

  const CONFIRM_COLORS = {
    default: { bg: 'rgba(99,102,241,0.18)',  border: 'rgba(99,102,241,0.6)',  text: '#a5b4fc', glow: 'rgba(99,102,241,0.35)'  },
    danger:  { bg: 'rgba(239,68,68,0.14)',   border: 'rgba(239,68,68,0.55)',  text: '#fca5a5', glow: 'rgba(239,68,68,0.3)'    },
    success: { bg: 'rgba(52,211,153,0.13)',  border: 'rgba(52,211,153,0.55)', text: '#6ee7b7', glow: 'rgba(52,211,153,0.3)'   },
  };
  const c = CONFIRM_COLORS[variant] || CONFIRM_COLORS.default;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={(e) => { if (!loading && e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          margin: '0 1rem',
          background: 'rgba(15,23,42,0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          padding: '1.75rem 1.75rem 1.5rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: c.bg,
            border: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: `0 0 16px ${c.glow}`,
          }}
        >
          {variant === 'danger' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : variant === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.92)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.015em',
          }}
        >
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
              marginBottom: '1.5rem',
            }}
          >
            {message}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.625rem', marginTop: message ? 0 : '1.5rem' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.055)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'rgba(255,255,255,0.055)'; }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.6rem 1rem',
              borderRadius: 10,
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.text,
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: `0 0 0 0 ${c.glow}`,
              opacity: loading ? 0.65 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = `0 0 14px ${c.glow}`; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 0 0 ${c.glow}`; }}
          >
            {loading ? 'Processing…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
