import { useState, useCallback } from 'react';
import { useTeam } from '../../context/TeamContext';
import { standupAPI } from '../../services/api';

const LABEL = { fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' };
const SECTION_WRAP = { marginBottom: '1.25rem' };

function Section({ title, children }) {
  return (
    <div style={SECTION_WRAP}>
      <div style={LABEL}>{title}</div>
      {children}
    </div>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: accent ? `${accent}12` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ? `${accent}25` : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, padding: '0.5rem 0.75rem', minWidth: 54,
    }}>
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: accent || 'white', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{label}</span>
    </div>
  );
}

export default function StandupModal() {
  const { currentTeam } = useTeam();
  const [open, setOpen]       = useState(false);
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  const generate = useCallback(async () => {
    if (!currentTeam) return;
    setOpen(true);
    setLoading(true);
    setReport(null);
    try {
      const { data } = await standupAPI.generate(currentTeam._id);
      setReport(data);
    } catch (err) {
      console.error('Standup generation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTeam]);

  const copyToClipboard = () => {
    if (!report?.plaintext) return;
    navigator.clipboard.writeText(report.plaintext).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportTxt = () => {
    if (!report?.plaintext) return;
    const blob = new Blob([report.plaintext], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href     = url;
    a.download = `standup-${currentTeam?.name?.replace(/\s+/g, '-') ?? 'team'}-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={generate}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          padding: '0.6rem 1rem', borderRadius: 10, marginBottom: '0.75rem',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 0 18px rgba(99,102,241,0.35)',
          color: 'white', fontSize: '0.8rem', fontWeight: 600,
          border: 'none', cursor: 'pointer',
          transition: 'opacity 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Generate Standup
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{
            position: 'relative', width: '100%', maxWidth: 520,
            maxHeight: '85vh', overflowY: 'auto',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 20,
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08)',
          }}>
            {/* Sticky header */}
            <div style={{
              position: 'sticky', top: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Standup</div>
                {report && (
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {new Date(report.generatedAt).toLocaleString()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem' }}>
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid rgba(99,102,241,0.2)',
                    borderTopColor: '#6366f1',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>Generating standup…</span>
                </div>
              )}

              {!loading && report && (
                <>
                  {/* Progress */}
                  <Section title="Progress">
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                      <StatPill label="Total"       value={report.progress.total}      />
                      <StatPill label="Done"        value={report.progress.completed}  accent="#34d399" />
                      <StatPill label="In Progress" value={report.progress.inProgress} accent="#60a5fa" />
                      <StatPill label="Queued"      value={report.progress.todo}       />
                    </div>
                    <div style={{
                      fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10, padding: '0.625rem 0.75rem', lineHeight: 1.5,
                    }}>
                      {report.progress.summary}
                    </div>
                  </Section>

                  {/* Blockers */}
                  <Section title={`Blockers (${report.blockers.length})`}>
                    {report.blockers.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: '#34d399' }}>No active blockers — clear track ✓</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {report.blockers.map((b, i) => (
                          <div key={i} style={{
                            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
                            borderRadius: 10, padding: '0.625rem 0.75rem',
                          }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>{b.task}</div>
                            <div style={{ fontSize: '0.71rem', color: '#fbbf24' }}>{b.reason}</div>
                            {b.assignedTo && <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>{b.assignedTo}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Top Contributor */}
                  {report.contributor?.name && (
                    <Section title="Top Contributor (24h)">
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
                        borderRadius: 10, padding: '0.625rem 0.75rem',
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'rgba(251,191,36,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', flexShrink: 0,
                        }}>
                          {report.contributor.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>{report.contributor.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
                            {report.contributor.actions} action{report.contributor.actions !== 1 ? 's' : ''} logged
                          </div>
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* Upcoming Deadlines */}
                  <Section title={`Upcoming Deadlines (${report.upcomingDeadlines.length})`}>
                    {report.upcomingDeadlines.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No tasks due in the next 24 hours</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {report.upcomingDeadlines.map((d, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)',
                            borderRadius: 10, padding: '0.5rem 0.75rem', fontSize: '0.75rem',
                          }}>
                            <span style={{ color: 'rgba(255,255,255,0.65)' }}>{d.title}</span>
                            <span style={{ color: '#f97316', flexShrink: 0, marginLeft: 8 }}>
                              {new Date(d.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  {/* Recommendations */}
                  {report.recommendations.length > 0 && (
                    <Section title="Recommendations">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {report.recommendations.map((r, i) => (
                          <div key={i} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '0.4rem' }}>
                            <span style={{ color: '#6366f1', flexShrink: 0 }}>›</span>{r}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Task Deletions */}
                  <Section title={`Task Deletions — 24h (${report.deletions?.count ?? 0})`}>
                    {report.deletions?.count === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No tasks deleted ✔</div>
                    ) : (
                      <div style={{
                        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)',
                        borderRadius: 10, padding: '0.625rem 0.75rem',
                      }}>
                        <div style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 600, marginBottom: '0.4rem' }}>
                          {report.deletions.summary}
                        </div>
                        {report.deletions.titles.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {report.deletions.titles.map((t, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.42)' }}>
                                <span style={{ color: '#f87171', flexShrink: 0 }}>•</span>"{t}"
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Section>

                  {/* Recent Activity */}
                  <Section title={`Recent Activity — 24h (${report.recentActivity?.length ?? 0})`}>
                    {!report.recentActivity || report.recentActivity.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No activity in the last 24 hours</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 200, overflowY: 'auto' }}>
                        {report.recentActivity.map((a, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)',
                            borderRadius: 8, padding: '0.38rem 0.6rem',
                          }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              background: a.action.toLowerCase().startsWith('deleted')
                                ? 'rgba(248,113,113,0.18)' : 'rgba(99,102,241,0.18)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.57rem', fontWeight: 800,
                              color: a.action.toLowerCase().startsWith('deleted') ? '#fca5a5' : '#a5b4fc',
                            }}>
                              {a.user.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{a.user} </span>
                              <span style={{
                                fontSize: '0.72rem',
                                color: a.action.toLowerCase().startsWith('deleted') ? '#fca5a5' : 'rgba(255,255,255,0.42)',
                              }}>{a.action}</span>
                              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)', marginTop: 1 }}>
                                {new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                </>
              )}
            </div>

            {/* Footer */}
            {!loading && report && (
              <div style={{
                position: 'sticky', bottom: 0,
                display: 'flex', gap: '0.625rem',
                padding: '0.875rem 1.25rem',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
              }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 9,
                    background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${copied ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    color: copied ? '#34d399' : 'rgba(255,255,255,0.65)',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
                <button
                  onClick={exportTxt}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 9,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none', color: 'white',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 0 14px rgba(99,102,241,0.3)',
                  }}
                >
                  Export .txt
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

