import { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';

export default function TeamMembersList() {
  const { currentTeam, updateMemberPermission } = useTeam();
  const { user } = useAuth();
  const [codeCopied, setCodeCopied] = useState(false);
  const [permTogglingId, setPermTogglingId] = useState(null); // memberId being updated

  if (!currentTeam) return null;

  const currentMember = currentTeam.members.find((m) => m.user._id === user._id);
  const isAdmin = currentMember?.role === 'admin';

  const copyCode = () => {
    navigator.clipboard.writeText(currentTeam.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handlePermissionToggle = async (memberId, current) => {
    if (permTogglingId) return; // debounce
    setPermTogglingId(memberId);
    try {
      await updateMemberPermission(memberId, !current);
    } catch (err) {
      console.error('Permission update failed:', err);
    } finally {
      setPermTogglingId(null);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.065)',
      borderRadius: 14, padding: '0.875rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
          Members
        </span>
        <span style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', padding: '0.1rem 0.45rem' }}>
          {currentTeam.members.length}
        </span>
      </div>

      {/* Invite code */}
      {isAdmin && (
        <div style={{
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 10, padding: '0.5rem 0.625rem', marginBottom: '0.625rem',
        }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginBottom: '0.2rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Invite Code</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.12em' }}>
              {currentTeam.inviteCode}
            </span>
            <button
              onClick={copyCode}
              style={{
                fontSize: '0.67rem', fontWeight: 600, padding: '0.15rem 0.4rem',
                borderRadius: 6, border: '1px solid rgba(59,130,246,0.25)',
                background: codeCopied ? 'rgba(52,211,153,0.12)' : 'rgba(59,130,246,0.1)',
                color: codeCopied ? '#34d399' : '#60a5fa', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {codeCopied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {currentTeam.members.map((m, idx) => {
          const isAdminMember = m.role === 'admin';
          // effective permission: admin always can create; others use the flag
          const effectiveCanCreate = isAdminMember || m.canCreateTask === true;
          const isCurrentUser = m.user._id === user._id;
          const isToggling = permTogglingId === m.user._id;
          const isLast = idx === currentTeam.members.length - 1;

          return (
            <div
              key={m.user._id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.28rem',
                padding: '0.4rem 0',
                borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* ── Top row: avatar · name · role badge ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                {/* Avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: isAdminMember
                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 700, color: 'white',
                  boxShadow: isAdminMember ? '0 0 8px rgba(59,130,246,0.3)' : 'none',
                }}>
                  {m.user.name?.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                  <span style={{
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.72)', fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
                  }}>
                    {m.user.name}
                    {isCurrentUser && (
                      <span style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>(you)</span>
                    )}
                  </span>
                </div>

                {/* Role badge */}
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, padding: '0.12rem 0.45rem',
                  borderRadius: 6, flexShrink: 0,
                  background: isAdminMember ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isAdminMember ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: isAdminMember ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {isAdminMember ? 'Admin' : 'Member'}
                </span>
              </div>

              {/* ── Second row: toggle + labels (admin view, non-admin members only) ── */}
              {isAdmin && !isAdminMember && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  paddingLeft: '2.15rem', /* indent under avatar */
                }}>
                  {/* Toggle */}
                  <button
                    onClick={() => handlePermissionToggle(m.user._id, effectiveCanCreate)}
                    disabled={isToggling}
                    title={effectiveCanCreate ? 'Revoke task creation permission' : 'Grant task creation permission'}
                    role="switch"
                    aria-checked={effectiveCanCreate}
                    style={{
                      position: 'relative',
                      width: 30, height: 17,
                      borderRadius: 99,
                      border: 'none',
                      cursor: isToggling ? 'wait' : 'pointer',
                      background: effectiveCanCreate ? '#34d399' : 'rgba(255,255,255,0.15)',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                      padding: 0,
                      outline: 'none',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 2,
                      left: effectiveCanCreate ? 15 : 2,
                      width: 13, height: 13,
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.18s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      opacity: isToggling ? 0.5 : 1,
                    }} />
                  </button>

                  {/* Label */}
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', userSelect: 'none' }}>
                    Allow Task Creation
                  </span>

                  {/* Task Creator badge — only when permission is on */}
                  {effectiveCanCreate && (
                    <span style={{
                      fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.38rem',
                      borderRadius: 6, flexShrink: 0,
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.22)',
                      color: '#34d399',
                      letterSpacing: '0.04em',
                    }}>
                      Task Creator
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
