import { useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTeam } from '../../context/TeamContext';
import { tasksAPI } from '../../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      padding: '0.6rem 0.85rem',
      fontSize: '0.72rem',
    }}>
      <div style={{ color: 'rgba(255,255,255,0.55)', marginBottom: '0.3rem', fontWeight: 700 }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

export default function BurndownChart() {
  const { currentTeam } = useTeam();
  const [open, setOpen]     = useState(false);
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!currentTeam) return;
    setOpen(true);
    if (data) return; // already loaded
    setLoading(true);
    try {
      const res = await tasksAPI.getBurndown(currentTeam._id);
      setData(res.data);
    } catch (e) {
      console.error('Burndown fetch failed:', e);
    } finally {
      setLoading(false);
    }
  }, [currentTeam, data]);

  // Refresh on next open so data stays fresh
  const toggle = () => {
    if (!open) { setData(null); load(); }
    else setOpen(false);
  };

  /* ── collapsed tile ── */
  if (!open) {
    return (
      <button
        onClick={toggle}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.065)',
          borderRadius: 14,
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Velocity Chart
        <span style={{ marginLeft: 'auto', opacity: 0.45 }}>▼</span>
      </button>
    );
  }

  /* ── expanded chart ── */
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.065)',
      borderRadius: 14,
      padding: '0.875rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          14-Day Velocity
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: '1rem', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {loading && (
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1.5rem 0' }}>
          Loading chart…
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total', value: data.totalTasks, color: '#94a3b8' },
              { label: 'Completed', value: data.data[data.data.length - 1]?.completed ?? 0, color: '#34d399' },
              { label: 'Remaining', value: data.data[data.data.length - 1]?.remaining ?? 0, color: '#f97316' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: `${color}12`, border: `1px solid ${color}30`,
                borderRadius: 8, padding: '0.25rem 0.6rem', fontSize: '0.65rem',
                display: 'flex', gap: '0.3rem', alignItems: 'center',
              }}>
                <span style={{ color, fontWeight: 700 }}>{value}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRemaining" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={3}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}
                iconType="circle"
                iconSize={6}
              />
              <Area
                type="monotone"
                dataKey="created"
                name="Total"
                stroke="#60a5fa"
                strokeWidth={1.5}
                fill="url(#gradCreated)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#34d399"
                strokeWidth={1.5}
                fill="url(#gradCompleted)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="remaining"
                name="Remaining"
                stroke="#f97316"
                strokeWidth={1.5}
                fill="url(#gradRemaining)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
