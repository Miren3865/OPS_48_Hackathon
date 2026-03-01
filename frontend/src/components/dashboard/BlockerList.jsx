import { useTeam } from '../../context/TeamContext';

export default function BlockerList() {
  const { tasks } = useTeam();
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');

  return (
    <div
      style={{
        background: blockedTasks.length > 0
          ? 'rgba(245,158,11,0.04)'
          : 'rgba(255,255,255,0.025)',
        border: blockedTasks.length > 0
          ? '1px solid rgba(245,158,11,0.15)'
          : '1px solid rgba(255,255,255,0.065)',
        borderRadius: 14,
        padding: '0.875rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={blockedTasks.length ? '#fbbf24' : 'rgba(255,255,255,0.35)'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: blockedTasks.length ? '#fbbf24' : 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
          Blockers
        </span>
        {blockedTasks.length > 0 && (
          <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, color: '#fbbf24', padding: '0.1rem 0.45rem' }}>
            {blockedTasks.length}
          </span>
        )}
      </div>

      {blockedTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
            No blockers — clear track ✓
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {blockedTasks.map((task) => (
            <div
              key={task._id}
              style={{
                background: 'rgba(245,158,11,0.07)',
                border: '1px solid rgba(245,158,11,0.15)',
                borderRadius: 10,
                padding: '0.625rem 0.75rem',
              }}
            >
              <div style={{ fontSize: '0.785rem', fontWeight: 600, color: 'rgba(255,255,255,0.78)', marginBottom: '0.25rem', lineHeight: 1.35 }}>
                {task.title}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#fbbf24', lineHeight: 1.4 }}>
                <span style={{ opacity: 0.65 }}>Reason: </span>
                {task.blockerReason || 'Not specified'}
              </div>
              {task.assignedTo && (
                <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>
                  Owner: {task.assignedTo.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

