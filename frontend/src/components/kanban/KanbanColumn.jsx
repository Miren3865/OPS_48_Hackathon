import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import { ALLOWED_TRANSITIONS } from '../../hooks/useWorkflowController';

const COLUMN_CONFIG = {
  todo: {
    label: 'To-Do',
    accent: 'rgba(148,163,184,0.6)',
    accentBg: 'rgba(148,163,184,0.06)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    emptyText: 'Queue is clear',
    dotColor: '#94a3b8',
  },
  inprogress: {
    label: 'In Progress',
    accent: 'rgba(59,130,246,0.7)',
    accentBg: 'rgba(59,130,246,0.06)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    ),
    emptyText: 'Nothing running yet',
    dotColor: '#60a5fa',
  },
  completed: {
    label: 'Completed',
    accent: 'rgba(16,185,129,0.65)',
    accentBg: 'rgba(16,185,129,0.06)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    emptyText: 'Nothing shipped yet',
    dotColor: '#34d399',
  },
  blocked: {
    label: 'Blocked',
    accent: 'rgba(245,158,11,0.65)',
    accentBg: 'rgba(245,158,11,0.06)',
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    emptyText: 'No blockers — great!',
    dotColor: '#fbbf24',
  },
};

export default function KanbanColumn({
  status,
  tasks,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onUnblockTask,
  currentUserId,
  activeDragStatus,
  isShaking,
  isAdmin,
}) {
  const cfg = COLUMN_CONFIG[status];

  const { setNodeRef, isOver } = useDroppable({ id: status });

  const isDragActive   = activeDragStatus !== null && activeDragStatus !== undefined;
  const isValidTarget  = isDragActive && activeDragStatus !== status &&
    Array.isArray(ALLOWED_TRANSITIONS[activeDragStatus]) &&
    ALLOWED_TRANSITIONS[activeDragStatus].includes(status);
  const showValidHover   = isOver && isValidTarget;
  const showInvalidHover = isOver && isDragActive && !isValidTarget;
  const showValidGhost   = isDragActive && isValidTarget && !isOver;

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', minWidth: 268, width: '100%', height: '100%' }}
      className={isShaking ? 'wf-shake' : ''}
    >
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          marginBottom: '0.5rem',
          background: showValidHover ? cfg.accentBg.replace('0.06', '0.12') : cfg.accentBg,
          border: `1px solid ${
            showValidHover    ? cfg.accent.replace('0.7','0.45').replace('0.65','0.45').replace('0.6','0.45')
            : showInvalidHover ? 'rgba(239,68,68,0.38)'
            : cfg.accent.replace('0.7','0.15').replace('0.65','0.15').replace('0.6','0.15')
          }`,
          borderRadius: 12,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.18s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: cfg.accent.replace('rgba(', 'rgb(').replace(/,[\d.]+\)/, ')'), display: 'flex', alignItems: 'center' }}>
            {cfg.icon}
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.78)', letterSpacing: '-0.01em' }}>
            {cfg.label}
          </span>
        </div>
        <span
          style={{
            minWidth: 22,
            height: 22,
            borderRadius: 99,
            background: cfg.accent.replace('0.7','0.15').replace('0.65','0.15').replace('0.6','0.15'),
            border: `1px solid ${cfg.accent.replace('0.7','0.25').replace('0.65','0.25').replace('0.6','0.25')}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: cfg.dotColor,
            padding: '0 5px',
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task list — droppable */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          background: showValidHover
            ? (status === 'completed' ? 'rgba(52,211,153,0.07)'
               : status === 'blocked'   ? 'rgba(245,158,11,0.07)'
               : 'rgba(59,130,246,0.07)')
            : showInvalidHover ? 'rgba(239,68,68,0.05)'
            : 'rgba(255,255,255,0.018)',
          border: `1px solid ${
            showValidHover
              ? (status === 'completed' ? 'rgba(52,211,153,0.45)'
                 : status === 'blocked'   ? 'rgba(245,158,11,0.45)'
                 : 'rgba(59,130,246,0.45)')
              : showInvalidHover ? 'rgba(239,68,68,0.3)'
              : showValidGhost
              ? (status === 'completed' ? 'rgba(52,211,153,0.18)'
                 : status === 'blocked'   ? 'rgba(245,158,11,0.18)'
                 : 'rgba(59,130,246,0.18)')
              : 'rgba(255,255,255,0.055)'
          }`,
          borderRadius: 14,
          padding: '0.625rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minHeight: 200,
          overflowY: 'auto',
          transition: 'all 0.18s ease',
          boxShadow: showValidHover
            ? `0 0 0 2px ${
                status === 'completed' ? 'rgba(52,211,153,0.22)'
                : status === 'blocked'   ? 'rgba(245,158,11,0.22)'
                : 'rgba(59,130,246,0.22)'
              }`
            : 'none',
        }}
      >
        {tasks.length === 0 && (
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '2rem 1rem', gap: '0.5rem',
            }}
          >
            {showValidHover ? (
              <>
                <div style={{ fontSize: '1.4rem', opacity: 0.75 }}>↓</div>
                <p style={{ fontSize: '0.75rem', color: cfg.dotColor, fontWeight: 600, textAlign: 'center', opacity: 0.9 }}>
                  Drop to move here
                </p>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 10, background: cfg.accentBg,
                    border: `1px solid ${cfg.accent.replace('0.7','0.15').replace('0.65','0.15').replace('0.6','0.15')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cfg.dotColor, opacity: 0.5,
                  }}
                >
                  {cfg.icon}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.22)', fontWeight: 500, textAlign: 'center' }}>
                  {cfg.emptyText}
                </p>
              </>
            )}
          </div>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            columnAccent={cfg.dotColor}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onUnblock={onUnblockTask}
            currentUserId={currentUserId}
          />
        ))}
        {/* Drop indicator bar at bottom of non-empty column */}
        {tasks.length > 0 && showValidHover && (
          <div
            style={{
              height: 3, borderRadius: 99, marginTop: 4,
              background: `linear-gradient(90deg, transparent, ${cfg.dotColor}, transparent)`,
              opacity: 0.65,
            }}
          />
        )}
      </div>

      {/* Add task — To-Do is admin-only; other columns are open to all members */}
      {status === 'todo' && !isAdmin ? (
        <div
          title="Only admins can add tasks to To-Do"
          style={{
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.55rem',
            borderRadius: 10,
            background: 'transparent',
            border: '1px dashed rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            cursor: 'not-allowed',
            userSelect: 'none',
          }}
        >
          {/* lock icon */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.18)', fontWeight: 500 }}>
            Admin only
          </span>
        </div>
      ) : (
        <button
          onClick={() => onAddTask(status)}
          style={{
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.55rem',
            borderRadius: 10,
            background: 'transparent',
            border: '1px dashed rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.32)',
            fontSize: '0.78rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = cfg.accent.replace('0.7','0.3').replace('0.65','0.3').replace('0.6','0.3');
            e.currentTarget.style.color = cfg.dotColor;
            e.currentTarget.style.background = cfg.accentBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.32)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add task
        </button>
      )}
    </div>
  );
}

