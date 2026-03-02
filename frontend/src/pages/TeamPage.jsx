import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Spinner from '../components/common/Spinner';
import KanbanBoard from '../components/kanban/KanbanBoard';
import StatsBar from '../components/dashboard/StatsBar';
import BlockerList from '../components/dashboard/BlockerList';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import TeamMembersList from '../components/team/TeamMembersList';
import RiskMeter from '../components/dashboard/RiskMeter';
import StandupModal from '../components/dashboard/StandupModal';
import BurndownChart from '../components/dashboard/BurndownChart';
import ChatLauncher from '../components/chat/ChatLauncher';

export default function TeamPage() {
  const { teamId } = useParams();
  const { currentTeam, loadTeam, loadingTeam } = useTeam();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    if (teamId) loadTeam(teamId);
  }, [teamId, loadTeam]);

  // If the team failed to load (deleted from DB), refresh the user so the stale
  // team entry is purged from the dashboard's team list automatically.
  useEffect(() => {
    if (!loadingTeam && !currentTeam && teamId) {
      refreshUser();
    }
  }, [loadingTeam, currentTeam, teamId]);

  if (loadingTeam) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <Spinner size="lg" />
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
          Loading team…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Team not found or access denied.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 60% 40% at 20% 0%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 90% 80%, rgba(139,92,246,0.05) 0%, transparent 50%), var(--bg-primary)',
      }}
    >
      <Navbar teamName={currentTeam.name} />

      <div className="team-layout" style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>

        {/* Mobile overlay — closes sidebar when tapped outside */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />

        {/* ── SIDEBAR ── */}
        <aside
          className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}
          style={{
            width: 288,
            flexShrink: 0,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.875rem',
          }}
        >
          <RiskMeter />
          <StandupModal />
          <BurndownChart />
          <StatsBar />
          <BlockerList />
          <TeamMembersList />
          <ActivityFeed />
        </aside>

        {/* ── MAIN BOARD ── */}
        <main
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Board header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              flexShrink: 0,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.15rem',
                }}
              >
                {currentTeam.name}
              </h1>
              {currentTeam.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                  {currentTeam.description}
                </p>
              )}
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem 0.75rem',
                borderRadius: 8,
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--card-bg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              All teams
            </button>

            {/* Mobile: toggle sidebar */}
            <button
              className="mobile-sidebar-btn"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
              </svg>
              Stats
            </button>

            {/* Keyboard shortcuts hint */}
            <div
              title="Press  shift+?  to see keyboard shortcuts"
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                userSelect: 'none',
              }}
            >
              <kbd style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 4,
                padding: '0 5px',
                fontSize: '0.62rem',
                fontFamily: 'monospace',
              }}>?</kbd>
              shortcuts
            </div>
          </div>

          <KanbanBoard />
        </main>

      </div>

      {/* ── FLOATING CHAT ── */}
      <ChatLauncher teamId={currentTeam._id} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

