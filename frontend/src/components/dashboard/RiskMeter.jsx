import { useTeam } from '../../context/TeamContext';

const CIRCUMFERENCE = Math.PI * 54;

const levelMeta = {
  Healthy:   { ring: '#34d399', badge: { bg: 'rgba(52,211,153,0.12)',  color: '#34d399'  }, label: 'Healthy'   },
  Moderate:  { ring: '#fbbf24', badge: { bg: 'rgba(251,191,36,0.12)',  color: '#fbbf24'  }, label: 'Moderate'  },
  'At Risk': { ring: '#f97316', badge: { bg: 'rgba(249,115,22,0.12)',  color: '#f97316'  }, label: 'At Risk'   },
  Critical:  { ring: '#f87171', badge: { bg: 'rgba(248,113,113,0.12)', color: '#f87171'  }, label: 'Critical'  },
};

const signalLabels = {
  completionRate: 'Completion',
  blockRatio:     'Blocked',
  overdueRatio:   'Overdue',
  urgentCount:    'Urgent 24h',
  imbalanceScore: 'Balance',
};

const isGoodHigh = (key) => key === 'completionRate';

function SignalBar({ signalKey, value }) {
  const label = signalLabels[signalKey] ?? signalKey;
  const good  = isGoodHigh(signalKey);
  const pct   = Math.min(100, Math.max(0, value));
  const color = good
    ? pct > 60 ? '#34d399' : pct > 30 ? '#fbbf24' : '#f87171'
    : pct < 20 ? '#34d399' : pct < 50 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}>
      <span style={{ width: 70, flexShrink: 0, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: color,
          transition: 'width 0.8s ease',
          boxShadow: `0 0 6px ${color}66`,
        }} />
      </div>
      <span style={{ width: 24, textAlign: 'right', color: 'rgba(255,255,255,0.35)' }}>
        {Math.round(pct)}
      </span>
    </div>
  );
}

export default function RiskMeter() {
  const { riskReport } = useTeam();

  if (!riskReport) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.065)',
        borderRadius: 14, padding: '0.875rem', marginBottom: '0.625rem',
      }}>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          Loading risk data…
        </div>
      </div>
    );
  }

  const { score, level, signals, advice } = riskReport;
  const meta   = levelMeta[level] ?? levelMeta['At Risk'];
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.065)',
      borderRadius: 14, padding: '0.875rem', marginBottom: '0.625rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Risk Radar
        </span>
        <span style={{
          background: meta.badge.bg, border: `1px solid ${meta.ring}33`,
          borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
          color: meta.badge.color, padding: '0.1rem 0.5rem',
        }}>
          {meta.label}
        </span>
      </div>

      {/* SVG Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.625rem' }}>
        <svg width="120" height="66" viewBox="0 0 120 66">
          <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" strokeLinecap="round" />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60" fill="none"
            stroke={meta.ring} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease', filter: `drop-shadow(0 0 6px ${meta.ring}88)` }}
          />
          <text x="60" y="53" textAnchor="middle" fontSize="20" fontWeight="700" fill="white">{score}</text>
          <text x="60" y="63" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.35)">/ 100</text>
        </svg>
      </div>

      {/* Signal bars */}
      {signals && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: advice?.length ? '0.625rem' : 0 }}>
          {Object.entries(signals).map(([key, val]) => (
            <SignalBar key={key} signalKey={key} value={val} />
          ))}
        </div>
      )}

      {/* Advice */}
      {advice && advice.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Suggestions
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {advice.map((tip, i) => (
              <li key={i} style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                <span style={{ color: meta.ring, marginRight: 4 }}>›</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

