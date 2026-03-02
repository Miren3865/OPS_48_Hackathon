import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { tasksAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

/**
 * TaskComments — inline comment thread shown inside the TaskModal.
 * Loads comments for the given task, supports adding new comments,
 * and subscribes to the 'comment:added' socket event for live updates.
 */
export default function TaskComments({ teamId, taskId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  // Load existing comments
  useEffect(() => {
    if (!taskId || !teamId) return;
    setLoading(true);
    tasksAPI.getComments(teamId, taskId)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [taskId, teamId]);

  // Subscribe to live comment events
  useEffect(() => {
    if (!taskId) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = ({ taskId: tid, comment }) => {
      if (tid !== taskId) return;
      setComments((prev) => {
        if (prev.find((c) => c._id === comment._id)) return prev;
        return [...prev, comment];
      });
    };
    socket.on('comment:added', handler);
    return () => socket.off('comment:added', handler);
  }, [taskId]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await tasksAPI.addComment(teamId, taskId, text.trim());
      setComments((prev) => {
        if (prev.find((c) => c._id === data._id)) return prev;
        return [...prev, data];
      });
      setText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [teamId, taskId, text]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Section label */}
      <div style={{
        fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        Comments {comments.length > 0 && `(${comments.length})`}
      </div>

      {/* Comment list */}
      <div style={{
        maxHeight: 200, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        paddingRight: '0.25rem',
      }}>
        {loading && (
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0.75rem 0' }}>
            Loading…
          </div>
        )}
        {!loading && comments.length === 0 && (
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '0.5rem 0' }}>
            No comments yet. Be first to comment!
          </div>
        )}
        {comments.map((c) => {
          const isMine = (c.author?._id ?? c.author)?.toString() === user?._id?.toString();
          return (
            <div
              key={c._id}
              style={{
                display: 'flex',
                flexDirection: isMine ? 'row-reverse' : 'row',
                gap: '0.5rem',
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: isMine ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 700, color: isMine ? '#93c5fd' : 'rgba(255,255,255,0.5)',
              }}>
                {(c.author?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                {/* Meta */}
                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', display: 'flex', gap: '0.35rem' }}>
                  <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>
                    {isMine ? 'You' : c.author?.name || 'Member'}
                  </span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                </div>
                {/* Bubble */}
                <div style={{
                  background: isMine ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isMine ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: isMine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {c.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {error && (
        <div style={{ fontSize: '0.7rem', color: '#f87171' }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Add a comment… (Enter to send, Shift+Enter for new line)"
          rows={2}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '0.45rem 0.65rem',
            fontSize: '0.78rem',
            color: '#e2e8f0',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.5,
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          style={{
            flexShrink: 0,
            background: text.trim() ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${text.trim() ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8,
            padding: '0.5rem 0.75rem',
            cursor: text.trim() && !submitting ? 'pointer' : 'not-allowed',
            color: text.trim() ? '#93c5fd' : 'rgba(255,255,255,0.25)',
            fontSize: '0.75rem',
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          {submitting ? '…' : '↑'}
        </button>
      </form>
    </div>
  );
}
