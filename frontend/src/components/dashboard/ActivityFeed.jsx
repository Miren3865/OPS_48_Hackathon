import { formatDistanceToNow } from 'date-fns';
import { useTeam } from '../../context/TeamContext';

const ACTION_STYLE = (action = '') => {
  if (action.includes('created'))   return { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' };
  if (action.includes('deleted'))   return { color: '#f87171', bg: 'rgba(248,113,113,0.12)' };
  if (action.includes('Blocked') || action.includes('blocked')) return { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' };
  if (action.includes('Completed') || action.includes('completed')) return { color: '#34d399', bg: 'rgba(52,211,153,0.12)' };
  if (action.includes('Progress') || action.includes('progress')) return { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' };
  if (action.includes('joined'))    return { color: '#34d399', bg: 'rgba(52,211,153,0.12)' };
  return { color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.06)' };
};

export default function ActivityFeed() {
  const { activityLogs } = useTeam();

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Activity
        </span>
      </div>

      {activityLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>
            No activity yet
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
            maxHeight: 220, overflowY: 'auto', paddingRight: 2,
          }}
        >
          {activityLogs.map((log) => {
            const style = ACTION_STYLE(log.action);
            const initials = (log.user?.name || 'S').charAt(0).toUpperCase();
            return (
              <div key={log._id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                {/* Avatar dot */}
                <div style={{
                  width: 22, height: 22,
                  background: style.bg,
                  border: `1px solid ${style.color}33`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, color: style.color,
                  flexShrink: 0, marginTop: 1,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    {log.user?.name || 'Someone'}{' '}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.38)' }}>{log.action}</span>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.22)', marginTop: 2 }}>
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
