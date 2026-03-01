import { useState } from 'react';

const PRIORITY_DOT = {
  high:   { color: '#f87171', label: 'High' },
  medium: { color: '#fbbf24', label: 'Med' },
  low:    { color: '#94a3b8', label: 'Low' },
};

const COLUMN_LABELS = {
  todo:       'To-Do',
  inprogress: 'In Progress',
  completed:  'Completed',
  blocked:    'Blocked',
};

/**
 * SelectTaskModal
 *
 * Shown when the user clicks "+ Add task" on In-Progress, Completed, or Blocked columns.
 * Displays tasks from allowed source statuses so the user can move one forward.
 *
 * Props:
 *   isOpen        — boolean
 *   targetStatus  — the column the user wants to move into ('inprogress'|'completed'|'blocked')
 *   sourceTasks   — tasks eligible to be selected (already filtered by caller)
 *   onSelect      — (task) => void   called when user picks a task
 *   onCancel      — () => void
 */
export default function SelectTaskModal({ isOpen, targetStatus, sourceTasks, onSelect, onCancel }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (!isOpen) return null;

  const isEmpty = !sourceTasks || sourceTasks.length === 0;

  // friendly label for the target column
  const destLabel = COLUMN_LABELS[targetStatus] || targetStatus;

  // source description
  const sourceDesc =
    targetStatus === 'inprogress'
      ? 'To-Do'
      : targetStatus === 'completed'
      ? 'In Progress'
      : 'To-Do, In Progress, or Completed';

  // Icon per target
  const targetIcon =
    targetStatus === 'inprogress' ? '⚡'
    : targetStatus === 'completed' ? '✅'
    : '🚧';

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="select-task-modal-title"
    >
      <div className="modal-panel" style={{ maxWidth: 520, width: '92%' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div
              style={{
                width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                background:
                  targetStatus === 'inprogress' ? 'rgba(59,130,246,0.14)'
                  : targetStatus === 'completed' ? 'rgba(52,211,153,0.14)'
                  : 'rgba(245,158,11,0.14)',
                border:
                  `1px solid ${targetStatus === 'inprogress' ? 'rgba(59,130,246,0.35)'
                  : targetStatus === 'completed' ? 'rgba(52,211,153,0.35)'
                  : 'rgba(245,158,11,0.35)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
              }}
            >
              {targetIcon}
            </div>
            <div>
              <h2
                id="select-task-modal-title"
                style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}
              >
                Move to {destLabel}
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.79rem', color: '#64748b', lineHeight: 1.4 }}>
                Select a task from <strong style={{ color: '#94a3b8' }}>{sourceDesc}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#475569',
              fontSize: '1.1rem', padding: '0.1rem 0.3rem', lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
          >
            ✕
          </button>
        </div>

        {/* Task list */}
        {isEmpty ? (
          <div
            style={{
              padding: '2.5rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.25)',
              fontSize: '0.85rem', fontWeight: 500,
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>📭</div>
            No eligible tasks available to move here.
          </div>
        ) : (
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: '0.45rem',
              maxHeight: 340, overflowY: 'auto', paddingRight: 2,
            }}
          >
            {sourceTasks.map((task) => {
              const pm = PRIORITY_DOT[task.priority] || PRIORITY_DOT.medium;
              const isHov = hoveredId === task._id;
              return (
                <button
                  key={task._id}
                  onClick={() => onSelect(task)}
                  onMouseEnter={() => setHoveredId(task._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    padding: '0.7rem 0.875rem', borderRadius: 10,
                    background: isHov ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isHov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.065)'}`,
                    transition: 'all 0.14s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    {/* Priority dot */}
                    <span
                      style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: pm.color, boxShadow: `0 0 6px ${pm.color}`,
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0, fontSize: '0.845rem', fontWeight: 600,
                          color: isHov ? '#f1f5f9' : 'rgba(255,255,255,0.78)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          transition: 'color 0.14s',
                        }}
                      >
                        {task.title}
                      </p>
                      {task.assignedTo && (
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                          {task.assignedTo.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Source status chip */}
                  <span
                    style={{
                      flexShrink: 0, fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.03em',
                      padding: '0.15rem 0.5rem', borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {COLUMN_LABELS[task.status] || task.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
