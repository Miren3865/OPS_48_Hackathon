/**
 * FilterBar — search & filter tasks by text, priority, and assignee.
 * Renders a compact bar above the Kanban board.
 */

const PILL = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  borderRadius: 99,
  padding: '0.25rem 0.65rem',
  fontSize: '0.68rem',
  fontWeight: 600,
  cursor: 'pointer',
  border: '1px solid',
  transition: 'all 0.15s',
  userSelect: 'none',
};

const PRIORITY_COLORS = {
  all:    { inactive: 'rgba(255,255,255,0.08)', active: 'rgba(255,255,255,0.18)', text: 'rgba(255,255,255,0.6)' },
  low:    { inactive: 'rgba(148,163,184,0.1)',  active: 'rgba(148,163,184,0.25)', text: '#94a3b8' },
  medium: { inactive: 'rgba(251,191,36,0.1)',   active: 'rgba(251,191,36,0.25)',  text: '#fbbf24' },
  high:   { inactive: 'rgba(248,113,113,0.1)',  active: 'rgba(248,113,113,0.25)', text: '#f87171' },
};

export default function FilterBar({ filters, setFilters, members, searchRef }) {
  const { search, priority, assignee } = filters;

  const setPriority = (p) => setFilters((f) => ({ ...f, priority: p }));
  const setAssignee = (a) => setFilters((f) => ({ ...f, assignee: a }));
  const setSearch   = (s) => setFilters((f) => ({ ...f, search: s }));
  const clearAll    = () => setFilters({ search: '', priority: 'all', assignee: 'all' });

  const hasActive = search || priority !== 'all' || assignee !== 'all';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
        padding: '0.625rem 0.875rem',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.065)',
        borderRadius: 12,
        flexShrink: 0,
      }}
    >
      {/* Search input */}
      <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search tasks…  (Press /)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearch('');
              e.target.blur();
              e.stopPropagation();
            }
          }}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '0.35rem 0.5rem 0.35rem 2rem',
            fontSize: '0.75rem',
            color: '#e2e8f0',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'rgba(96,165,250,0.5)')}
          onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', lineHeight: 1 }}
          >✕</button>
        )}
      </div>

      {/* Priority filter */}
      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
        {['all', 'high', 'medium', 'low'].map((p) => {
          const c = PRIORITY_COLORS[p];
          const active = priority === p;
          return (
            <button
              key={p}
              onClick={() => setPriority(p)}
              style={{
                ...PILL,
                background: active ? c.active : c.inactive,
                borderColor: active ? c.text + '60' : 'transparent',
                color: active ? c.text : 'rgba(255,255,255,0.4)',
              }}
            >
              {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Assignee filter */}
      {members.length > 0 && (
        <select
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '0.3rem 0.6rem',
            fontSize: '0.72rem',
            color: assignee !== 'all' ? '#60a5fa' : 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <option value="all" style={{ background: '#1e293b', color: '#e2e8f0' }}>All Members</option>
          {members.map((m) => (
            <option key={m.user._id || m.user} value={m.user._id || m.user} style={{ background: '#1e293b', color: '#e2e8f0' }}>
              {m.user.name || 'Member'}
            </option>
          ))}
        </select>
      )}

      {/* Clear filters */}
      {hasActive && (
        <button
          onClick={clearAll}
          style={{
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 8,
            padding: '0.3rem 0.65rem',
            fontSize: '0.68rem',
            color: '#f87171',
            cursor: 'pointer',
            flexShrink: 0,
            fontWeight: 600,
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
