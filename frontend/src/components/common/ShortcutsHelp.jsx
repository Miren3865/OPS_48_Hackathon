/**
 * ShortcutsHelp — modal overlay showing all keyboard shortcuts.
 * Triggered by pressing '?' anywhere on the board.
 */

const SHORTCUTS = [
  { key: 'N',   desc: 'New task (To-Do column)' },
  { key: '/',   desc: 'Focus search bar' },
  { key: '?',   desc: 'Show keyboard shortcuts' },
  { key: 'Esc', desc: 'Close modal / clear search' },
];

export default function ShortcutsHelp({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15,15,30,0.97)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 18,
          padding: '1.75rem 2rem',
          minWidth: 340,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>
            ⌨️ Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '1.1rem' }}
          >✕</button>
        </div>

        {/* Shortcuts list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <kbd style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 7,
                padding: '0.25rem 0.65rem',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#93c5fd',
                minWidth: 38,
                textAlign: 'center',
                boxShadow: '0 2px 0 rgba(0,0,0,0.4)',
                flexShrink: 0,
              }}>
                {key}
              </kbd>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.25rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          Press <kbd style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '0 4px', fontSize: '0.68rem' }}>Esc</kbd> or click outside to close
        </div>
      </div>
    </div>
  );
}
