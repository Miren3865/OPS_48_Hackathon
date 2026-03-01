import { formatDistanceToNow, isPast, isToday, differenceInHours, differenceInMinutes } from 'date-fns';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/** Format a deadline that is within 12h as a short countdown string */
function fmtCountdown(deadline) {
  const now = new Date();
  const totalMins = differenceInMinutes(new Date(deadline), now);
  if (totalMins <= 0) return 'Overdue';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const PRIORITY_META = {
  low:    { color: '#94a3b8', label: 'Low',    bg: 'rgba(148,163,184,0.12)' },
  medium: { color: '#fbbf24', label: 'Med',    bg: 'rgba(251,191,36,0.12)'  },
  high:   { color: '#f87171', label: 'High',   bg: 'rgba(248,113,113,0.12)' },
};

export default function TaskCard({ task, columnAccent = '#94a3b8', onEdit, onDelete, onUnblock, currentUserId, isDragOverlay }) {
  const isBlocked  = task.status === 'blocked';
  const isComplete = task.status === 'completed';
  const isInProgress = task.status === 'inprogress';
  const isOverdue  = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'completed';
  const isDueToday = task.deadline && isToday(new Date(task.deadline));
  const canDelete  = task.createdBy?._id === currentUserId;

  // Ownership: only the assigned member (or unassigned tasks) are draggable
  const assignedId = task.assignedTo?._id ?? task.assignedTo;
  const isOwner = !assignedId || assignedId.toString() === currentUserId?.toString();

  // Urgent = non-completed, has deadline, due within next 12 hours (but not yet overdue)
  const TWELVE_H_MS = 12 * 60 * 60 * 1000;
  const isUrgent =
    !isComplete &&
    !isOverdue &&
    task.deadline &&
    new Date(task.deadline).getTime() - Date.now() <= TWELVE_H_MS;

  // Blocked and Completed tasks are terminal — disable dragging entirely
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    disabled: isBlocked || isComplete || isDragOverlay || !isOwner,
    data: { task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : !isOwner ? 0.55 : 1,
    cursor: isBlocked || isComplete || isInProgress ? 'default' : !isOwner ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'opacity 0.15s ease',
  };

  const pMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`task-card${isBlocked ? ' task-blocked-pulse' : ''}${isComplete ? ' task-completed-glow' : ''}${isUrgent ? ' task-urgent-glow' : ''}${isOverdue ? ' task-overdue-glow' : ''}`}
      style={{ '--task-accent': columnAccent, ...style }}
      onClick={() => !isDragging && !isComplete && !isInProgress && onEdit(task)}
    >
      {/* Non-owner lock badge */}
      {!isOwner && !isBlocked && (
        <div
          title="Only the assigned member can move this task"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginBottom: '0.45rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '0.15rem 0.5rem',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Locked
        </div>
      )}
      {/* Blocked banner */}
      {isBlocked && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.4rem',
            marginBottom: '0.6rem',
            background: 'rgba(245,158,11,0.09)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
            padding: '0.4rem 0.6rem',
            fontSize: '0.72rem',
            color: '#fbbf24',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ lineHeight: 1.4, flex: 1 }}>
            <strong>Blocked:</strong> {task.blockerReason || 'No reason given'}
          </span>
          {onUnblock && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onUnblock(task); }}
              title="Unblock this task"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.18rem 0.6rem',
                borderRadius: 6,
                border: '1px solid rgba(52,211,153,0.45)',
                background: 'rgba(52,211,153,0.08)',
                color: '#34d399',
                fontSize: '0.67rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.03em',
                transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(52,211,153,0.2)';
                e.currentTarget.style.borderColor = 'rgba(52,211,153,0.8)';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(52,211,153,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(52,211,153,0.08)';
                e.currentTarget.style.borderColor = 'rgba(52,211,153,0.45)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* unlock icon */}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
              Unblock
            </button>
          )}
        </div>
      )}

      {/* Title */}
      <h4
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: isComplete ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.88)',
          lineHeight: 1.45,
          marginBottom: '0.4rem',
          letterSpacing: '-0.01em',
          textDecoration: isComplete ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p
          style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.32)',
            lineHeight: 1.55,
            marginBottom: '0.625rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {/* Priority badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: pMeta.bg,
              borderRadius: 5,
              padding: '0.15rem 0.45rem',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: pMeta.color,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: pMeta.color, flexShrink: 0 }} />
            {pMeta.label}
          </span>

          {/* Assigned */}
          {task.assignedTo ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'rgba(59,130,246,0.1)',
                borderRadius: 5,
                padding: '0.15rem 0.45rem',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.68rem', color: '#93c5fd', fontWeight: 500 }}>
                {task.assignedTo.name?.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>
              Unassigned
            </span>
          )}
        </div>

        {/* Deadline */}
        {task.deadline && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '0.18rem 0.5rem',
              borderRadius: 6,
              background: isOverdue
                ? 'rgba(248,113,113,0.12)'
                : isDueToday
                ? 'rgba(251,191,36,0.12)'
                : 'rgba(255,255,255,0.06)',
              color: isOverdue
                ? '#f87171'
                : isUrgent
                ? '#fb923c'
                : isDueToday
                ? '#fbbf24'
                : 'rgba(255,255,255,0.35)',
              border: isOverdue
                ? '1px solid rgba(248,113,113,0.25)'
                : isUrgent
                ? '1px solid rgba(251,146,60,0.35)'
                : isDueToday
                ? '1px solid rgba(251,191,36,0.2)'
                : '1px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {isOverdue
              ? 'Overdue'
              : isUrgent
              ? `⏱ ${fmtCountdown(task.deadline)}`
              : isDueToday
              ? 'Today'
              : formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Delete (creator only) */}
      {canDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
          style={{
            marginTop: '0.5rem',
            fontSize: '0.68rem',
            color: 'rgba(248,113,113,0)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            transition: 'color 0.15s ease',
          }}
          className="delete-btn"
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(248,113,113,0)')}
        >
          Delete
        </button>
      )}
    </div>
  );
}

