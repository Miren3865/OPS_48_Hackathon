import { useEffect, useRef, useState } from 'react';

/**
 * MentionDropdown
 * Props:
 *   members  – [{ id, name }] already filtered by parent
 *   onSelect – (member) => void
 *   query    – current search string (for bold-highlighting match)
 */
export default function MentionDropdown({ members, onSelect, query }) {
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  /* reset active index when list changes */
  useEffect(() => setActive(0), [members.length]);

  /* keyboard navigation forwarded via a custom event from ChatInput */
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, members.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (members[active]) {
          e.preventDefault();
          onSelect(members[active]);
        }
      }
    };
    window.addEventListener('keydown', handle, true);
    return () => window.removeEventListener('keydown', handle, true);
  }, [active, members, onSelect]);

  /* scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.children[active];
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!members.length) return null;

  const highlight = (name) => {
    if (!query) return name;
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <strong style={{ color: '#93c5fd' }}>{name.slice(idx, idx + query.length)}</strong>
        {name.slice(idx + query.length)}
      </>
    );
  };

  return (
    <>
      <style>{`
        @keyframes mentionFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mention-item:hover { background: rgba(255,255,255,0.07) !important; }
      `}</style>
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          right: 0,
          marginBottom: 6,
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.15)',
          backdropFilter: 'blur(16px)',
          overflow: 'hidden',
          animation: 'mentionFadeIn 0.16s ease',
          zIndex: 200,
          maxHeight: 200,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        <div
          style={{
            padding: '0.35rem 0.7rem 0.25rem',
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          Mention a teammate
        </div>
        <ul ref={listRef} style={{ listStyle: 'none', margin: 0, padding: '0.25rem 0' }}>
          {members.map((m, i) => (
            <li
              key={m.id}
              className="mention-item"
              onMouseDown={(e) => { e.preventDefault(); onSelect(m); }}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.45rem 0.75rem',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
                background:
                  i === active ? 'rgba(99,102,241,0.18)' : 'transparent',
              }}
            >
              {/* avatar circle */}
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.78)' }}>
                {highlight(m.name)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
