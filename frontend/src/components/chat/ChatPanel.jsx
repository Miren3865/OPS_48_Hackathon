import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import { chatAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

/* ─── main component ──────────────────────────────────────────── */
export default function ChatPanel({ teamId, isOpen = true, onUnread }) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // Derive flat member list [{id, name}] for mention dropdown — exclude self
  const members = (currentTeam?.members || []).reduce((acc, m) => {
    const u = m.user;
    if (u && String(u._id || u) !== String(user?._id || user?.id)) {
      acc.push({ id: String(u._id || u), name: u.name || '' });
    }
    return acc;
  }, []);

  /* scroll to bottom whenever messages change */
  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  /* load history + join room + listen for new messages */
  useEffect(() => {
    if (!teamId) return;

    let active = true;

    // 1. Fetch history
    chatAPI
      .getMessages(teamId)
      .then((res) => {
        if (active) setMessages(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    // 2. Join socket room
    const socket = getSocket();
    if (socket) {
      socket.emit('joinTeamRoom', teamId);

      // 3. Receive new messages
      socket.on('receiveMessage', (msg) => {
        if (!active) return;
        setMessages((prev) => [...prev, msg]);
        // notify parent of unread when drawer is closed
        if (!isOpen && typeof onUnread === 'function') onUnread();
      });
    }

    return () => {
      active = false;
      if (socket) {
        socket.off('receiveMessage');
      }
    };
  }, [teamId]);

  /* send message via socket */
  const sendMessage = useCallback((text, mentionIds = []) => {
    if (!text || sending) return;
    const socket = getSocket();
    if (!socket) return;
    setSending(true);
    socket.emit(
      'sendMessage',
      { teamId, message: text, mentions: mentionIds },
      () => setSending(false)
    );
  }, [teamId, sending]);

  /* ── render ── */
  return (
    <>
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-input::placeholder { color: rgba(255,255,255,0.22); }
        .chat-input:focus { outline: none; }
        .chat-send-btn:hover { background: rgba(59,130,246,0.3) !important; }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* outer wrapper is now provided by ChatDrawer */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >

        {/* ── messages ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          }}
        >
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.08)',
                  borderTop: '2px solid rgba(139,92,246,0.6)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          ) : messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: 0.35,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                No messages yet
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage
                key={msg._id || i}
                msg={msg}
                isOwn={
                  (msg.sender?._id || msg.sender) === (user?._id || user?.id)
                }
                currentUserId={user?._id || user?.id}
              />
            ))
          )}
          {/* scroll anchor */}
          <div ref={bottomRef} />
        </div>

        <ChatInput
          onSend={sendMessage}
          members={members}
          disabled={sending}
        />
      </div>
    </>
  );
}
