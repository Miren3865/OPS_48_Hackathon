import { useTeam } from '../../context/TeamContext';

const STAT_CONFIG = [
  { key: 'total',      label: 'Total',       color: '#e2e8f0', dot: '#94a3b8' },
  { key: 'todo',       label: 'Queued',      color: '#94a3b8', dot: '#64748b' },
  { key: 'inprogress', label: 'Active',      color: '#93c5fd', dot: '#3b82f6' },
  { key: 'completed',  label: 'Done',        color: '#6ee7b7', dot: '#10b981' },
  { key: 'blocked',    label: 'Blocked',     color: '#fcd34d', dot: '#f59e0b' },
];

export default function StatsBar() {
  const { stats } = useTeam();

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.065)',
        borderRadius: 14,
        padding: '0.875rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Progress
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em' }}>
          {stats.completionRate}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 5,
          borderRadius: 99,
          background: 'rgba(255,255,255,0.07)',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}
      >
        <div
          className="progress-fill"
          style={{ height: '100%', width: `${stats.completionRate}%` }}
        />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.3rem' }}>
        {STAT_CONFIG.map((s) => (
          <div
            key={s.key}
            style={{
              textAlign: 'center',
              padding: '0.375rem 0.2rem',
              borderRadius: 8,
              background: s.key === 'blocked' && stats.blocked > 0
                ? 'rgba(245,158,11,0.07)'
                : 'rgba(255,255,255,0.025)',
              border: s.key === 'blocked' && stats.blocked > 0
                ? '1px solid rgba(245,158,11,0.15)'
                : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>
              {stats[s.key]}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.28)', fontWeight: 600, marginTop: 2, letterSpacing: '0.02em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.625rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
        <span>{stats.completed} shipped</span>
        <span>{stats.total - stats.completed} remaining</span>
      </div>
    </div>
  );
}

