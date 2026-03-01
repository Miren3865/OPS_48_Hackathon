import { useState } from 'react';
import { useTeam } from '../../context/TeamContext';

/**
 * DeadlineBanner
 * Shows a dismissable red alert bar above the kanban board when any
 * non-completed tasks are overdue or due within the next 12 hours.
 * Derives urgency directly from the tasks array — no extra state needed.
 */
export default function DeadlineBanner() {
  const { tasks, deadlineAlerts } = useTeam();
  const [dismissed, setDismissed] = useState(false);

  const now = Date.now();
  const TWELVE_H = 12 * 60 * 60 * 1000;

  const overdue = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.deadline &&
      new Date(t.deadline).getTime() < now
  );

  const urgent = tasks.filter(
    (t) =>
      t.status !== 'completed' &&
      t.deadline &&
      new Date(t.deadline).getTime() >= now &&
      new Date(t.deadline).getTime() - now <= TWELVE_H
  );

  const total = overdue.length + urgent.length;

  // Also re-show if a fresh socket alert arrives (even if user dismissed)
  const showFromSocket = deadlineAlerts.length > 0;

  if (total === 0 && !showFromSocket) return null;
  if (dismissed && !showFromSocket) return null;

  const label =
    overdue.length > 0 && urgent.length > 0
      ? `${overdue.length} overdue, ${urgent.length} approaching deadline`
      : overdue.length > 0
      ? `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue`
      : `${urgent.length} task${urgent.length > 1 ? 's are' : ' is'} approaching deadline`;

  return (
    <>
      <style>{`
        @keyframes bannerSlideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
          50%       { box-shadow: 0 0 12px 4px rgba(239,68,68,0.15); }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.55rem 1rem',
          marginBottom: '0.875rem',
          borderRadius: 10,
          background: 'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.07) 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          animation: 'bannerSlideDown 0.25s ease, bannerPulse 3s ease-in-out infinite',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
          {/* warning icon */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f87171"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>

          <p
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#fca5a5',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            ⚠&nbsp; {label}
          </p>

          {/* pill list of task titles (max 3) */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flexShrink: 0 }}>
            {[...overdue, ...urgent].slice(0, 3).map((t) => (
              <span
                key={t._id}
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  padding: '0.12rem 0.5rem',
                  borderRadius: 4,
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#fca5a5',
                  whiteSpace: 'nowrap',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {t.title}
              </span>
            ))}
            {total > 3 && (
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  padding: '0.12rem 0.5rem',
                  borderRadius: 4,
                  background: 'rgba(239,68,68,0.1)',
                  color: 'rgba(252,165,165,0.7)',
                }}
              >
                +{total - 3} more
              </span>
            )}
          </div>
        </div>

        {/* dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss deadline alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            background: 'rgba(239,68,68,0.15)',
            color: 'rgba(252,165,165,0.7)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.3)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </>
  );
}
