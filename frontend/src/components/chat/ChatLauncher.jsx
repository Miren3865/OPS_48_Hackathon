import { useState, useCallback } from 'react';
import ChatDrawer from './ChatDrawer';

export default function ChatLauncher({ teamId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnread(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleUnread = useCallback(() => {
    setUnread((n) => n + 1);
  }, []);

  return (
    <>
      <style>{`
        @keyframes chatBtnPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.45), 0 8px 32px rgba(99,102,241,0.35); }
          50%       { box-shadow: 0 0 0 8px rgba(99,102,241,0),  0 8px 32px rgba(99,102,241,0.35); }
        }
        .chat-fab {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 50;
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%);
          animation: chatBtnPulse 2.8s ease-in-out infinite;
          transition: transform 0.2s ease, opacity 0.2s ease;
          outline: none;
        }
        .chat-fab:hover  { transform: scale(1.1); }
        .chat-fab:active { transform: scale(0.95); }
        .chat-fab-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #ef4444;
          border: 2px solid #030712;
          font-size: 0.65rem;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          pointer-events: none;
          animation: chatFadeIn 0.2s ease;
        }
        @keyframes chatFadeIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── floating action button ── */}
      <button
        className="chat-fab"
        onClick={handleOpen}
        aria-label="Open team chat"
        title="Team Chat"
      >
        {/* chat bubble icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        {/* unread badge — only shown when drawer is closed and there are unread messages */}
        {!isOpen && unread > 0 && (
          <span className="chat-fab-badge">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* ── drawer ── */}
      <ChatDrawer
        teamId={teamId}
        isOpen={isOpen}
        onClose={handleClose}
        onUnread={handleUnread}
      />
    </>
  );
}
