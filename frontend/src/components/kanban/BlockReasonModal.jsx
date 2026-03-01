import { useState, useEffect, useRef } from 'react';

/**
 * BlockReasonModal
 * Glassmorphism modal that requires a non-empty blocker reason.
 *
 * Props:
 *   isOpen    — boolean
 *   task      — task being blocked (can be null)
 *   onConfirm — (reason: string) => void
 *   onCancel  — () => void
 */
export default function BlockReasonModal({ isOpen, task, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTouched(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) { setTouched(true); return; }
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;
  const invalid = touched && !reason.trim();

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div className="modal-panel" style={{ maxWidth: 480, width: '90%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            }}
          >
            🚧
          </div>
          <div>
            <h2 id="block-modal-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              Mark as Blocked
            </h2>
            {task && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                Task:{' '}
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>{task.title}</span>
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Textarea */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label
              htmlFor="block-reason-input"
              style={{
                display: 'block', fontSize: '0.76rem', fontWeight: 600,
                color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase',
                marginBottom: '0.45rem',
              }}
            >
              Blocker Reason <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <textarea
              id="block-reason-input"
              ref={inputRef}
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (touched && e.target.value.trim()) setTouched(false); }}
              onBlur={() => setTouched(true)}
              placeholder="e.g. Waiting for design approval, API dependency not ready…"
              rows={3}
              maxLength={300}
              style={{
                width: '100%', padding: '0.65rem 0.875rem', resize: 'vertical', minHeight: 76,
                background: invalid ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${invalid ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, color: '#e2e8f0', fontSize: '0.875rem', lineHeight: 1.5,
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.target.style.borderColor = invalid ? 'rgba(239,68,68,0.75)' : 'rgba(245,158,11,0.5)'; }}
              onBlurCapture={(e) => { if (!invalid) e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.28rem' }}>
              <span style={{ fontSize: '0.73rem', color: invalid ? '#ef4444' : 'transparent', transition: 'color 0.18s' }}>
                {invalid ? 'A blocker reason is required.' : '‎'}
              </span>
              <span style={{ fontSize: '0.7rem', color: reason.length > 260 ? '#f59e0b' : '#475569' }}>
                {reason.length}/300
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ minWidth: 80 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              style={{
                padding: '0.55rem 1.2rem', borderRadius: 10, border: 'none', fontFamily: 'inherit',
                cursor: reason.trim() ? 'pointer' : 'not-allowed',
                fontSize: '0.875rem', fontWeight: 700,
                background: reason.trim()
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'rgba(255,255,255,0.06)',
                color: reason.trim() ? '#0f0f1a' : '#475569',
                transition: 'all 0.18s',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              🚧 Mark Blocked
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
