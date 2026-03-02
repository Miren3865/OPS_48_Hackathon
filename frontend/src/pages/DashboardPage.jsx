import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import { CreateTeamModal, JoinTeamModal } from '../components/team/TeamModals';
import ConfirmModal from '../components/common/ConfirmModal';
import { teamsAPI } from '../services/api';

const TEAM_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
];

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Always fetch fresh team list from server — removes teams deleted directly in DB
  useEffect(() => { refreshUser(); }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // ── Delete state ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null);   // { _id, name } | null
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteOne = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await teamsAPI.deleteTeam(deleteTarget._id);
      await refreshUser();
    } catch (err) {
      console.error('Delete team failed:', err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await teamsAPI.deleteAllTeams();
      await refreshUser();
    } catch (err) {
      console.error('Delete all teams failed:', err);
    } finally {
      setDeleting(false);
      setDeleteAllOpen(false);
    }
  };

  const handleTeamCreated = async (team) => {
    await refreshUser();
    navigate(`/team/${team._id}`);
  };

  const handleTeamJoined = async (team) => {
    await refreshUser();
    navigate(`/team/${team._id}`);
  };

  const teams = user?.teams || [];
  const firstName = user?.name?.split(' ')[0] || 'there';

  const getHour = () => new Date().getHours();
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 70% 50% at 30% 0%, rgba(59,130,246,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 60%, rgba(139,92,246,0.06) 0%, transparent 50%), var(--bg-primary)',
      }}
    >
      <Navbar />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* ── Welcome header ── */}
        <div className="animate-fade-up" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                {greeting}
              </p>
              <h1
                style={{
                  fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                  background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.65) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {firstName}.
              </h1>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 400 }}>
                {teams.length === 0
                  ? 'Create your first team and start commanding.'
                  : `You're managing ${teams.length} team${teams.length !== 1 ? 's' : ''}.`}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {teams.length > 0 && (
                <button
                  onClick={() => setDeleteAllOpen(true)}
                  className="btn-secondary"
                  style={{ gap: '0.4rem', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                  Delete all
                </button>
              )}
              <button
                onClick={() => setShowJoin(true)}
                className="btn-secondary"
                style={{ gap: '0.4rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                Join team
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="btn-primary"
                style={{ gap: '0.4rem' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New team
              </button>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="divider" />

        {/* ── Teams grid ── */}
        {teams.length === 0 ? (
          <div
            className="animate-fade-up"
            style={{
              marginTop: '3rem',
              textAlign: 'center',
              padding: '5rem 2rem',
              background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 20,
            }}
          >
            {/* Floating icon */}
            <div
              className="animate-float"
              style={{
                width: 72,
                height: 72,
                margin: '0 auto 2rem',
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>
              No teams yet
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 340, margin: '0 auto 2rem', lineHeight: 1.65 }}>
              Create your first team to get a real-time command center for everyone working with you.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ padding: '0.65rem 1.75rem' }}>
                Create a team
              </button>
              <button onClick={() => setShowJoin(true)} className="btn-secondary" style={{ padding: '0.65rem 1.75rem' }}>
                Join with invite code
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            {teams.map((team, i) => (
              <button
                key={team._id || team}
                onClick={() => navigate(`/team/${team._id || team}`)}
                className="animate-fade-up"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 18,
                  padding: '1.5rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  animationDelay: `${i * 0.05}s`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px rgba(59,130,246,0.1), 0 16px 48px rgba(0,0,0,0.4), 0 4px 16px rgba(59,130,246,0.07)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--card-bg)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Gradient glow corner */}
                <div style={{
                  position: 'absolute', top: 0, right: 0, width: 80, height: 80,
                  background: `radial-gradient(circle, ${TEAM_GRADIENTS[i % TEAM_GRADIENTS.length].match(/#[\w]+/g)?.[0] || '#3b82f6'}22 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                {/* Delete button */}
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ _id: team._id || team, name: team.name || 'Team' });
                  }}
                  title="Delete team"
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(248,113,113,0)',
                    border: '1px solid rgba(248,113,113,0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    zIndex: 2,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(248,113,113,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(248,113,113,0)';
                    e.currentTarget.style.borderColor = 'rgba(248,113,113,0)';
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>

                {/* Avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: TEAM_GRADIENTS[i % TEAM_GRADIENTS.length],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {(team.name || 'T')?.charAt(0).toUpperCase()}
                </div>

                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.3rem',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {team.name || 'Team'}
                </h3>

                {team.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.875rem', lineHeight: 1.5 }}>
                    {team.description}
                  </p>
                )}

                {team.inviteCode && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 6,
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                    marginBottom: '0.75rem',
                  }}>
                    {team.inviteCode}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(99,179,250,0.7)', fontWeight: 600, letterSpacing: '0.02em' }}>
                    Open board →
                  </span>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
              </button>
            ))}

            {/* Add new team tile */}
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: 'var(--bg-surface, rgba(255,255,255,0.015))',
                border: '1px dashed var(--border-color)',
                borderRadius: 18,
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: 160,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.05)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface, rgba(255,255,255,0.015))';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                New team
              </span>
            </button>
          </div>
        )}
      </main>

      <CreateTeamModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleTeamCreated}
      />
      <JoinTeamModal
        isOpen={showJoin}
        onClose={() => setShowJoin(false)}
        onJoined={handleTeamJoined}
      />

      {/* ── Delete single team confirmation ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete team?"
        message={`"${deleteTarget?.name}" and all its tasks will be permanently deleted. This cannot be undone.`}
        confirmText="Yes, delete team"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteOne}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      {/* ── Delete all teams confirmation ── */}
      <ConfirmModal
        isOpen={deleteAllOpen}
        title="Delete all teams?"
        message={`All ${teams.length} team(s) you admin, along with their tasks and activity, will be permanently deleted. This cannot be undone.`}
        confirmText="Yes, delete all"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteAll}
        onCancel={() => !deleting && setDeleteAllOpen(false)}
      />
    </div>
  );
}

