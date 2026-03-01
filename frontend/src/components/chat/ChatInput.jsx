import { useState, useRef, useCallback } from 'react';
import MentionDropdown from './MentionDropdown';

/**
 * Scan backwards from the cursor position for an active @mention trigger.
 * Returns { query, start } or null.
 */
function detectTrigger(text, cursorPos) {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@([a-zA-Z0-9_\- ]*)$/);
  if (match) return { query: match[1], start: match.index };
  return null;
}

/**
 * ChatInput
 * Props:
 *   onSend   – (message: string, mentionIds: string[]) => void
 *   members  – [{ id, name }]  team members for mention dropdown
 *   disabled – bool
 */
export default function ChatInput({ onSend, members = [], disabled }) {
  const [value, setValue] = useState('');
  const [mentions, setMentions] = useState([]);      // [{ id, name }] confirmed picks
  const [trigger, setTrigger]   = useState(null);    // { query, start } | null
  const textareaRef = useRef(null);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 72) + 'px';
  };

  const handleChange = (e) => {
    const text = e.target.value;
    setValue(text);
    autoGrow();
    const cursor = e.target.selectionStart;
    setTrigger(detectTrigger(text, cursor));
  };

  /* also re-check trigger on cursor moves */
  const handleSelect = () => {
    if (!textareaRef.current) return;
    setTrigger(detectTrigger(value, textareaRef.current.selectionStart));
  };

  const handleKeyDown = (e) => {
    if (trigger) {
      // Let MentionDropdown's window listener handle Arrow/Enter/Tab
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) return;
      if (e.key === 'Escape') { setTrigger(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMentionSelect = useCallback((member) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const tr = detectTrigger(value, cursor);
    if (!tr) return;

    const before = value.slice(0, tr.start);
    const after  = value.slice(cursor);
    const inserted = `@${member.name} `;
    const newValue = before + inserted + after;

    setValue(newValue);
    setTrigger(null);

    // Add to confirmed mentions (dedup)
    setMentions((prev) =>
      prev.find((m) => m.id === member.id) ? prev : [...prev, member]
    );

    // Restore focus + cursor after insertion
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      const pos = before.length + inserted.length;
      textareaRef.current.setSelectionRange(pos, pos);
      autoGrow();
    });
  }, [value]);

  const handleSend = () => {
    const text = value.trim();
    if (!text || disabled) return;

    // Only send mentions whose @Name still appears in the text
    const activeMentions = mentions.filter((m) =>
      text.includes(`@${m.name}`)
    );

    onSend(text, activeMentions.map((m) => m.id));
    setValue('');
    setMentions([]);
    setTrigger(null);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    });
  };

  // Filter members by current query (case-insensitive includes)
  const filteredMembers = trigger
    ? members
        .filter((m) =>
          m.name.toLowerCase().includes(trigger.query.toLowerCase())
        )
        .slice(0, 7)
    : [];

  return (
    <>
      <style>{`
        .chat-input::placeholder { color: rgba(255,255,255,0.22); }
        .chat-input:focus { outline: none; }
        .chat-send-btn { transition: background 0.15s ease; }
        .chat-send-btn:hover:not(:disabled) { background: rgba(59,130,246,0.3) !important; }
        .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div
        style={{
          padding: '0.65rem 0.75rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end',
          position: 'relative',
        }}
      >
        {/* mention dropdown (floats above input) */}
        {trigger && filteredMembers.length > 0 && (
          <MentionDropdown
            members={filteredMembers}
            query={trigger.query}
            onSelect={handleMentionSelect}
          />
        )}

        <textarea
          ref={textareaRef}
          className="chat-input"
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          placeholder="Message… (@ to mention)"
          maxLength={1000}
          disabled={disabled}
          style={{
            flex: 1,
            resize: 'none',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10,
            color: 'rgba(255,255,255,0.85)',
            fontSize: '0.82rem',
            padding: '0.45rem 0.65rem',
            lineHeight: 1.45,
            transition: 'border-color 0.15s ease',
            overflowY: 'hidden',
          }}
          onFocus={(e)  => (e.target.style.borderColor = 'rgba(139,92,246,0.45)')}
          onBlur={(e)   => (e.target.style.borderColor = 'rgba(255,255,255,0.09)')}
        />

        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          title="Send (Enter)"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid rgba(59,130,246,0.3)',
            background: 'rgba(59,130,246,0.18)',
            color: 'rgba(96,165,250,0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </>
  );
}
