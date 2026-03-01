const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');

/**
 * AUTO-STANDUP GENERATOR — Backend Service
 *
 * Analyzes the team's task board and activity log to produce
 * a human-readable standup report automatically:
 *  - Progress summary
 *  - Blocker summary
 *  - Most active contributor (last 24 hours)
 *  - Upcoming deadlines (next 24 hours)
 *  - Smart recommendations
 */
const generateStandup = async (teamId) => {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Load all tasks and recent activity in parallel
  const [tasks, recentLogs] = await Promise.all([
    Task.find({ team: teamId })
      .populate('assignedTo', 'name')
      .populate('blockedBy', 'name')
      .populate('createdBy', 'name'),
    ActivityLog.find({
      team: teamId,
      createdAt: { $gte: yesterday },
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(100),
  ]);

  const total = tasks.length;

  // ── Progress summary ─────────────────────────────────────────────────────
  const byStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    inprogress: tasks.filter((t) => t.status === 'inprogress'),
    completed: tasks.filter((t) => t.status === 'completed'),
    blocked: tasks.filter((t) => t.status === 'blocked'),
  };

  const completionRate =
    total > 0 ? Math.round((byStatus.completed.length / total) * 100) : 0;

  const progress = {
    total,
    completed: byStatus.completed.length,
    inProgress: byStatus.inprogress.length,
    todo: byStatus.todo.length,
    completionRate,
    summary: `${byStatus.completed.length}/${total} tasks completed (${completionRate}%). ${byStatus.inprogress.length} in progress, ${byStatus.todo.length} not started.`,
  };

  // ── Blocker summary ──────────────────────────────────────────────────────
  const blockers = byStatus.blocked.map((t) => ({
    task: t.title,
    reason: t.blockerReason || 'No reason provided',
    blockedBy: t.blockedBy?.name || 'Unknown',
    assignedTo: t.assignedTo?.name || 'Unassigned',
  }));

  const blockerSummary =
    blockers.length === 0
      ? 'No blockers. Team is unobstructed.'
      : `${blockers.length} blocker${blockers.length > 1 ? 's' : ''}: ${blockers.map((b) => `"${b.task}" (${b.reason})`).join('; ')}.`;

  // ── Most active contributor (last 24 hours — ALL action types) ────────────
  const activityCount = {};
  recentLogs.forEach((log) => {
    const name = log.user?.name;
    if (name) activityCount[name] = (activityCount[name] || 0) + 1;
  });

  let topContributor = null;
  let topCount = 0;
  Object.entries(activityCount).forEach(([name, count]) => {
    if (count > topCount) { topContributor = name; topCount = count; }
  });

  const contributor = topContributor
    ? { name: topContributor, actions: topCount, summary: `${topContributor} led activity with ${topCount} action${topCount > 1 ? 's' : ''} in the last 24 hours.` }
    : { name: null, actions: 0, summary: 'No activity recorded in the last 24 hours.' };

  // ── Task deletions (last 24 hours) ───────────────────────────────────────
  const deletionLogs = recentLogs.filter((log) =>
    typeof log.action === 'string' && log.action.toLowerCase().startsWith('deleted')
  );
  const deletedCount = deletionLogs.length;
  const deletedTitles = deletionLogs.map((log) => {
    // action is: deleted task "<title>"
    const match = log.action.match(/"([^"]+)"/);
    return match ? match[1] : log.entityTitle || 'Unknown';
  });
  const deletionSummary =
    deletedCount === 0
      ? 'No tasks deleted.'
      : `${deletedCount} task${deletedCount > 1 ? 's were' : ' was'} deleted in the last 24 hours.`;

  // ── Recent activity log (all types, newest first, capped at 25) ──────────
  const recentActivity = recentLogs.slice(0, 25).map((log) => ({
    user: log.user?.name || 'Unknown',
    action: log.action,
    time: log.createdAt,
  }));

  // ── Upcoming deadlines (next 24 hours) ───────────────────────────────────
  const upcomingTasks = tasks
    .filter(
      (t) =>
        t.deadline &&
        t.status !== 'completed' &&
        new Date(t.deadline) >= now &&
        new Date(t.deadline) <= next24h
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .map((t) => ({
      title: t.title,
      deadline: t.deadline,
      assignedTo: t.assignedTo?.name || 'Unassigned',
      status: t.status,
    }));

  const deadlineSummary =
    upcomingTasks.length === 0
      ? 'No deadlines in the next 24 hours.'
      : `${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's' : ''} due within 24 hours: ${upcomingTasks.map((t) => `"${t.title}" (${t.assignedTo})`).join(', ')}.`;

  // ── Smart recommendations ─────────────────────────────────────────────────
  const recommendations = [];

  if (blockers.length > 0)
    recommendations.push(`Immediately address ${blockers.length} blocker${blockers.length > 1 ? 's' : ''} to unblock the team.`);

  const overdueTasks = tasks.filter(
    (t) => t.deadline && t.status !== 'completed' && new Date(t.deadline) < now
  );
  if (overdueTasks.length > 0)
    recommendations.push(`${overdueTasks.length} task${overdueTasks.length > 1 ? 's are' : ' is'} overdue — reassign or deadline-adjust immediately.`);

  if (upcomingTasks.length > 0)
    recommendations.push(`Push hard on ${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's' : ''} due in the next 24 hours.`);

  if (byStatus.inprogress.length === 0 && byStatus.todo.length > 0)
    recommendations.push('Nobody is actively working. Pull tasks from the backlog now.');

  if (completionRate >= 80)
    recommendations.push('Great momentum! Polish and finalize remaining tasks for the demo.');

  if (deletedCount > 5)
    recommendations.push('High deletion activity detected. Ensure scope clarity and avoid scope creep.');

  if (recommendations.length === 0)
    recommendations.push('Team is operating well. Maintain current pace.');

  // ── Assemble final standup report ────────────────────────────────────────
  return {
    generatedAt: new Date().toISOString(),
    progress,
    blockers,
    blockerSummary,
    contributor,
    upcomingDeadlines: upcomingTasks,
    deadlineSummary,
    deletions: { count: deletedCount, titles: deletedTitles, summary: deletionSummary },
    recentActivity,
    recommendations,
    // Pre-formatted plaintext version for copy/export
    plaintext: [
      `📋 TEAM STANDUP — ${new Date().toLocaleString()}`,
      '',
      `📊 PROGRESS`,
      progress.summary,
      '',
      `🚧 BLOCKERS`,
      blockerSummary,
      '',
      `⭐ TOP CONTRIBUTOR`,
      contributor.summary,
      '',
      `⏰ UPCOMING DEADLINES`,
      deadlineSummary,
      '',
      `🗑 TASK DELETIONS (24H)`,
      deletionSummary,
      ...(deletedTitles.length > 0 ? deletedTitles.map((t) => `  • "${t}"`) : []),
      '',
      `📅 RECENT ACTIVITY (24H)`,
      ...(recentActivity.length === 0
        ? ['No activity in the last 24 hours.']
        : recentActivity.map((a) => `  • [${new Date(a.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${a.user}: ${a.action}`)
      ),
      '',
      `💡 RECOMMENDATIONS`,
      ...recommendations.map((r) => `• ${r}`),
    ].join('\n'),
  };
};

module.exports = { generateStandup };
