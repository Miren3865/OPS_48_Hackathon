import { useEffect, useRef } from 'react';
import ChatPanel from './ChatPanel';

export default function ChatDrawer({ teamId, isOpen, onClose, onUnread }) {
  const drawerRef = useRef(null);

  /* close on Escape key */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <>
      <style>{`
        .chat-overlay {
          position: fixed;
          inset: 0;
          z-index: 55;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          transition: opacity 0.3s ease;
        }
        .chat-overlay-hidden {
          opacity: 0;
          pointer-events: none;
        }
        .chat-drawer {
          position: fixed;
          top: 0;
          right: 0;
          z-index: 60;
          width: 380px;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(
            160deg,
            rgba(15, 23, 42, 0.92) 0%,
            rgba(9, 9, 11, 0.96) 100%
          );
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: -8px 0 48px rgba(0, 0, 0, 0.6), -1px 0 0 rgba(255,255,255,0.04);
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .chat-drawer-open {
          transform: translateX(0);
        }
        @media (max-width: 480px) {
          .chat-drawer { width: 100vw; }
        }
      `}</style>

      {/* dim overlay — click to close */}
      <div
        className={`chat-overlay${isOpen ? '' : ' chat-overlay-hidden'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* sliding drawer */}
      <div
        ref={drawerRef}
        className={`chat-drawer${isOpen ? ' chat-drawer-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Team Chat"
      >
        {/* drawer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.1rem 0.85rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            {/* live dot */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 7px rgba(34,197,94,0.75)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Team Chat
            </span>
          </div>

          {/* close button */}
          <button
            onClick={onClose}
            aria-label="Close chat"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* chat content — only mount when open to avoid background socket duplication */}
        {isOpen && (
          <ChatPanel teamId={teamId} isOpen={isOpen} onUnread={onUnread} />
        )}
      </div>
    </>
  );
}
