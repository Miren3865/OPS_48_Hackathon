const Task = require('../models/Task');

/**
 * EXECUTION RISK RADAR — Backend Calculation Service
 *
 * Calculates a 0-100 team health score based on 5 weighted signals:
 *  1. Completion Rate     — are tasks getting done?
 *  2. Blocked Penalty     — each blocker drags down health
 *  3. Overdue Penalty     — past-deadline tasks = danger
 *  4. Deadline Pressure   — tasks due within 24 hrs
 *  5. Workload Imbalance  — one person doing everything = risk
 *
 * Returns structured report with score, level, signals, and advice.
 */
const calculateRiskRadar = async (teamId) => {
  const tasks = await Task.find({ team: teamId }).populate('assignedTo', 'name');

  const total = tasks.length;
  const now = new Date();

  // ── Signal 1: Completion rate (higher = healthier) ──────────────────────
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const completionRate = total > 0 ? (completed / total) * 100 : 100;

  // ── Signal 2: Blocked tasks ──────────────────────────────────────────────
  const blockedCount = tasks.filter((t) => t.status === 'blocked').length;
  const blockRatio = total > 0 ? (blockedCount / total) * 100 : 0;

  // ── Signal 3: Overdue tasks (non-completed, past deadline) ───────────────
  const overdueTasks = tasks.filter(
    (t) =>
      t.deadline &&
      t.status !== 'completed' &&
      new Date(t.deadline) < now
  );
  const overdueCount = overdueTasks.length;
  const overdueRatio = total > 0 ? (overdueCount / total) * 100 : 0;

  // ── Signal 4: Deadline pressure (due within next 24 hours) ───────────────
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const urgentTasks = tasks.filter(
    (t) =>
      t.deadline &&
      t.status !== 'completed' &&
      new Date(t.deadline) >= now &&
      new Date(t.deadline) <= next24h
  );
  const urgentCount = urgentTasks.length;

  // ── Signal 5: Workload imbalance ─────────────────────────────────────────
  // Count active (non-completed) tasks per assignee
  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.assignedTo
  );
  const workloadMap = {};
  activeTasks.forEach((t) => {
    const name = t.assignedTo?.name || 'unassigned';
    workloadMap[name] = (workloadMap[name] || 0) + 1;
  });
  const workloadValues = Object.values(workloadMap);
  let imbalanceScore = 0;
  if (workloadValues.length > 1) {
    const max = Math.max(...workloadValues);
    const avg = workloadValues.reduce((a, b) => a + b, 0) / workloadValues.length;
    imbalanceScore = Math.min(((max - avg) / Math.max(avg, 1)) * 30, 30);
  }

  // ── Compose final health score (0–100, higher = healthier) ──────────────
  // Start at 100, subtract penalties
  let score = 100;
  score -= blockRatio * 1.2;        // Each % blocked costs 1.2 pts
  score -= overdueRatio * 1.5;      // Overdue is costlier
  score -= urgentCount * 4;         // Each urgent task costs 4 pts
  score -= imbalanceScore;          // Workload imbalance deduction
  score += (completionRate - 50) * 0.2; // Bonus/malus for completion rate
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Risk level label ─────────────────────────────────────────────────────
  let level, color;
  if (score >= 80) { level = 'Healthy';  color = 'green'; }
  else if (score >= 60) { level = 'Moderate'; color = 'yellow'; }
  else if (score >= 40) { level = 'At Risk';  color = 'orange'; }
  else { level = 'Critical'; color = 'red'; }

  // ── Smart advice ─────────────────────────────────────────────────────────
  const advice = [];
  if (blockedCount > 0)
    advice.push(`${blockedCount} blocker${blockedCount > 1 ? 's' : ''} need immediate attention.`);
  if (overdueCount > 0)
    advice.push(`${overdueCount} task${overdueCount > 1 ? 's are' : ' is'} overdue — re-prioritize now.`);
  if (urgentCount > 0)
    advice.push(`${urgentCount} task${urgentCount > 1 ? 's' : ''} due within 24 hours.`);
  if (imbalanceScore > 15)
    advice.push('Workload is uneven — consider redistributing tasks.');
  if (score >= 80)
    advice.push('Team is on track. Keep the momentum going!');

  return {
    score,
    level,
    color,
    signals: {
      completionRate: Math.round(completionRate),
      blockedCount,
      overdueCount,
      urgentCount,
      imbalanceScore: Math.round(imbalanceScore),
    },
    totals: { total, completed },
    advice,
    calculatedAt: new Date().toISOString(),
  };
};

module.exports = { calculateRiskRadar };
