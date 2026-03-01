/**
 * ChatMessage
 * Replaces ChatBubble. Adds:
 *  - @mention highlighted tokens (blue pill)
 *  - subtle background glow when the current user is mentioned
 *
 * Props:
 *   msg           – message object from server (populated sender + mentions)
 *   isOwn         – bool: message sent by current user
 *   currentUserId – string: current user's _id
 */

const fmt = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Parses message text and injects styled <span> elements for each @Name token
 * that corresponds to an entry in the populated mentions array.
 */
function renderWithMentions(text, mentions) {
  if (!text) return null;
  if (!mentions?.length) return text;

  // Build a map name→id for populated mentions
  const nameMap = {};
  for (const m of mentions) {
    const name = m?.name || m; // handle populated or raw
    if (name) nameMap[name] = true;
  }

  const names = Object.keys(nameMap);
  if (!names.length) return text;

  // Escape special regex chars in names
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`@(${escaped.join('|')})`, 'g');

  const parts = [];
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span
        key={`mention-${match.index}`}
        style={{
          background: 'rgba(59,130,246,0.18)',
          color: '#60a5fa',
          borderRadius: 4,
          padding: '0 5px',
          fontWeight: 600,
          fontSize: '0.8em',
          boxShadow: '0 0 6px rgba(59,130,246,0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        @{match[1]}
      </span>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function ChatMessage({ msg, isOwn, currentUserId }) {
  // Check if the current user is mentioned in this message
  const isMentioned =
    !isOwn &&
    Array.isArray(msg.mentions) &&
    msg.mentions.some((m) => {
      const id = String(m?._id || m?.id || m);
      return id === String(currentUserId);
    });

  const body = renderWithMentions(msg.message, msg.mentions);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        gap: '0.2rem',
        animation: 'chatFadeIn 0.22s ease',
      }}
    >
      {/* sender name + timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexDirection: isOwn ? 'row-reverse' : 'row',
        }}
      >
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: isOwn ? 'rgba(96,165,250,0.85)' : 'rgba(167,139,250,0.85)',
          }}
        >
          {isOwn ? 'You' : msg.sender?.name || 'Unknown'}
        </span>
        <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.2)' }}>
          {fmt(msg.createdAt)}
        </span>
      </div>

      {/* message bubble */}
      <div
        style={{
          maxWidth: '85%',
          padding: '0.5rem 0.75rem',
          borderRadius: isOwn ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          fontSize: '0.82rem',
          lineHeight: 1.5,
          color: 'rgba(255,255,255,0.88)',
          wordBreak: 'break-word',
          background: isMentioned
            ? 'linear-gradient(135deg, rgba(37,99,235,0.35) 0%, rgba(99,102,241,0.25) 100%)'
            : isOwn
              ? 'linear-gradient(135deg, rgba(37,99,235,0.45) 0%, rgba(59,130,246,0.3) 100%)'
              : 'linear-gradient(135deg, rgba(109,40,217,0.4) 0%, rgba(139,92,246,0.25) 100%)',
          border: isMentioned
            ? '1px solid rgba(99,102,241,0.5)'
            : isOwn
              ? '1px solid rgba(59,130,246,0.35)'
              : '1px solid rgba(139,92,246,0.3)',
          boxShadow: isMentioned
            ? '0 0 16px rgba(99,102,241,0.28)'
            : isOwn
              ? '0 0 12px rgba(59,130,246,0.18)'
              : '0 0 12px rgba(139,92,246,0.15)',
        }}
      >
        {/* "you were mentioned" badge */}
        {isMentioned && (
          <div
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color: 'rgba(165,180,252,0.8)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '0.3rem',
            }}
          >
            ✦ You were mentioned
          </div>
        )}
        {body}
      </div>
    </div>
  );
}
