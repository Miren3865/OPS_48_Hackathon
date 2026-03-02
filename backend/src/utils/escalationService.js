const cron = require('node-cron');
const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendDeadlineWarningEmail, sendOverdueTaskEmail } = require('./mailer');

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

/**
 * Initialise and start the deadline escalation cron job.
 * Runs every 10 minutes.
 *
 * @param {import('socket.io').Server} io  – Socket.IO server instance
 */
const runEscalationCheck = async (io) => {
  console.log('[Escalation] Running deadline check…');

    try {
      const now = new Date();
      const twelveHoursFromNow = new Date(now.getTime() + TWELVE_HOURS_MS);

      /**
       * Find tasks that:
       * - are NOT completed
       * - have a deadline set
       * - deadline is at or before 12 h from now (includes already-overdue)
       * - escalation has NOT been sent yet (avoid duplicate emails)
       */
      const criticalTasks = await Task.find({
        status: { $ne: 'completed' },
        deadline: { $exists: true, $ne: null, $lte: twelveHoursFromNow },
        escalationSent: { $ne: true },
      })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .populate('team', 'name members');

      if (!criticalTasks.length) {
        console.log('[Escalation] No critical tasks found.');
        return;
      }

      console.log(`[Escalation] Found ${criticalTasks.length} critical task(s).`);

      // ── Admins cache (keyed by teamId string) ─────────────────────────────
      const teamAdminCache = {};

      const getTeamAdmins = async (team) => {
        const key = String(team._id);
        if (teamAdminCache[key]) return teamAdminCache[key];

        const adminIds = team.members
          .filter((m) => m.role === 'admin')
          .map((m) => m.user);

        const admins = await User.find({ _id: { $in: adminIds } }).select('name email');
        teamAdminCache[key] = admins;
        return admins;
      };

      // ── Process each task ─────────────────────────────────────────────────
      await Promise.all(
        criticalTasks.map(async (task) => {
          try {
            const deadline = new Date(task.deadline);
            const isOverdue = deadline < now;
            const teamId = String(task.team._id);
            const teamName = task.team.name || 'your team';
            const teamUrl = `${process.env.CLIENT_URL}/team/${teamId}`;

            // ── 1. Email assigned member ─────────────────────────────────────
            if (task.assignedTo?.email) {
              const emailFn = isOverdue
                ? sendOverdueTaskEmail
                : sendDeadlineWarningEmail;

              console.log(`[Escalation] Sending ${isOverdue ? 'overdue' : 'warning'} email → ${task.assignedTo.email}`);
              await emailFn(
                task.assignedTo.email,
                task.assignedTo.name,
                task.title,
                deadline,
                teamName,
                teamUrl
              ).catch((e) =>
                console.error(`[Escalation] Email to assignee failed: ${e.message}`)
              );
            } else {
              console.warn(`[Escalation] Task "${task.title}" — no assignee email, skipping assignee notification`);
            }

            // ── 2. Notify team admins (skip if admin === assignee) ───────────
            const admins = await getTeamAdmins(task.team);
            await Promise.all(
              admins
                .filter(
                  (a) =>
                    !task.assignedTo ||
                    String(a._id) !== String(task.assignedTo._id)
                )
                .map((admin) => {
                  const emailFn = isOverdue
                    ? sendOverdueTaskEmail
                    : sendDeadlineWarningEmail;
                  return emailFn(
                    admin.email,
                    admin.name,
                    task.title,
                    deadline,
                    teamName,
                    teamUrl
                  ).catch((e) =>
                    console.error(
                      `[Escalation] Admin email failed (${admin.email}): ${e.message}`
                    )
                  );
                })
            );

            // ── 3. Emit real-time alert to the team room ─────────────────────
            io.to(teamId).emit('deadlineAlert', {
              taskId: task._id,
              taskTitle: task.title,
              title: task.title,
              deadline: task.deadline,
              isOverdue,
              assignedToId: task.assignedTo?._id || null,
              assignedTo: task.assignedTo
                ? { name: task.assignedTo.name }
                : null,
            });

            // ── 4. Mark escalation sent ──────────────────────────────────────
            await Task.findByIdAndUpdate(task._id, { escalationSent: true });

            // ── 5. Log activity (use createdBy as actor since it's automated) ─
            await ActivityLog.create({
              team: task.team._id,
              user: task.createdBy?._id || task.team.members[0]?.user,
              action: isOverdue
                ? `⚠ Task "${task.title}" is overdue — escalated`
                : `🕐 Task "${task.title}" is nearing its deadline — escalated`,
              entityType: 'task',
              entityId: task._id,
              entityTitle: task.title,
              meta: { isOverdue, deadline: task.deadline },
            });

            console.log(
              `[Escalation] ✓ Processed "${task.title}" (${isOverdue ? 'overdue' : 'urgent'})`
            );
          } catch (taskErr) {
            console.error(
              `[Escalation] Error processing task ${task._id}:`,
              taskErr.message,
              taskErr.stack
            );
          }
        })
      );
    } catch (err) {
      console.error('[Escalation] Scheduler error:', err);
    }
};

const startEscalationScheduler = (io) => {
  // Run immediately on startup so you don't wait for the first cron tick
  runEscalationCheck(io).catch((e) =>
    console.error('[Escalation] Initial run error:', e)
  );

  // Then repeat every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    runEscalationCheck(io).catch((e) =>
      console.error('[Escalation] Cron run error:', e)
    );
  });

  console.log('🕐 Deadline escalation scheduler started (runs on boot + every 10 minutes)');
};

module.exports = { startEscalationScheduler, runEscalationCheck };
