/**
 * notificationService.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Event-driven email notification service for OpsBoard.
 *
 * Exported functions:
 *   sendTaskAssignedNotification(task, teamId, actorName)
 *     → emails ALL team admins when a task is assigned / reassigned
 *
 *   sendTaskCompletedNotification(task, teamId, actorName)
 *     → emails ALL team members when a task is marked completed
 *
 *   sendTaskBlockedNotification(task, teamId, actorName, blockerReason)
 *     → emails ALL team members when a task is marked blocked
 *
 * All functions:
 *   • never throw (errors are caught and logged)
 *   • are designed to be called inside setImmediate() so they never block
 *     the HTTP response
 * ──────────────────────────────────────────────────────────────────────────────
 */

const Team = require('../models/Team');
const {
  sendAdminTaskAssignedEmail,
  sendTeamTaskCompletedEmail,
  sendTeamTaskBlockedEmail,
} = require('../utils/mailer');

// ─── Task Assigned → notify all Admins ────────────────────────────────────────
/**
 * @param {Object} task       – populated Task document (assignedTo.name available)
 * @param {string} teamId     – MongoDB team _id string
 * @param {string} actorName  – display name of user who performed the assignment
 */
const sendTaskAssignedNotification = async (task, teamId, actorName) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const teamUrl = `${frontendUrl}/team/${teamId}`;

    const team = await Team.findById(teamId).populate('members.user', 'name email');
    if (!team) {
      console.warn('[Notification] sendTaskAssignedNotification: team not found', teamId);
      return;
    }

    const teamName = team.name;
    const assigneeName = task.assignedTo?.name || 'a member';

    // Only admins with a valid email address
    const admins = team.members
      .filter((m) => m.role === 'admin' && m.user?.email)
      .map((m) => m.user);

    if (!admins.length) {
      console.log('[Notification] No admins with email found for team', teamId);
      return;
    }

    await Promise.all(
      admins.map((admin) =>
        sendAdminTaskAssignedEmail(
          admin.email,
          admin.name,
          task.title,
          actorName,
          assigneeName,
          teamName,
          teamUrl
        ).catch((e) =>
          console.error(
            `[Notification] Admin assignment email failed (${admin.email}): ${e.message}`
          )
        )
      )
    );

    console.log(
      `[Notification] Task-assigned emails sent to ${admins.length} admin(s) for task "${task.title}".`
    );
  } catch (err) {
    console.error('[Notification] sendTaskAssignedNotification error:', err.message);
  }
};

// ─── Task Completed → notify all Members ──────────────────────────────────────
/**
 * @param {Object} task       – populated Task document
 * @param {string} teamId     – MongoDB team _id string
 * @param {string} actorName  – display name of user who completed the task
 */
const sendTaskCompletedNotification = async (task, teamId, actorName) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const teamUrl = `${frontendUrl}/team/${teamId}`;

    const team = await Team.findById(teamId).populate('members.user', 'name email');
    if (!team) {
      console.warn('[Notification] sendTaskCompletedNotification: team not found', teamId);
      return;
    }

    const teamName = team.name;

    // All members with a valid email address
    const members = team.members
      .filter((m) => m.user?.email)
      .map((m) => m.user);

    if (!members.length) {
      console.log('[Notification] No members with email found for team', teamId);
      return;
    }

    await Promise.all(
      members.map((member) =>
        sendTeamTaskCompletedEmail(
          member.email,
          member.name,
          task.title,
          actorName,
          teamName,
          teamUrl
        ).catch((e) =>
          console.error(
            `[Notification] Team completion email failed (${member.email}): ${e.message}`
          )
        )
      )
    );

    console.log(
      `[Notification] Task-completed emails sent to ${members.length} member(s) for task "${task.title}".`
    );
  } catch (err) {
    console.error('[Notification] sendTaskCompletedNotification error:', err.message);
  }
};

// ─── Task Blocked → notify all Members ────────────────────────────────────────
/**
 * @param {Object} task          – populated Task document
 * @param {string} teamId        – MongoDB team _id string
 * @param {string} actorName     – display name of user who blocked the task
 * @param {string} blockerReason – reason entered for the blocker
 */
const sendTaskBlockedNotification = async (task, teamId, actorName, blockerReason) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const teamUrl = `${frontendUrl}/team/${teamId}`;

    const team = await Team.findById(teamId).populate('members.user', 'name email');
    if (!team) {
      console.warn('[Notification] sendTaskBlockedNotification: team not found', teamId);
      return;
    }

    const teamName = team.name;

    // All members with a valid email address
    const members = team.members
      .filter((m) => m.user?.email)
      .map((m) => m.user);

    if (!members.length) {
      console.log('[Notification] No members with email found for team', teamId);
      return;
    }

    await Promise.all(
      members.map((member) =>
        sendTeamTaskBlockedEmail(
          member.email,
          member.name,
          task.title,
          actorName,
          blockerReason || 'No reason provided',
          teamName,
          teamUrl
        ).catch((e) =>
          console.error(
            `[Notification] Team blocked email failed (${member.email}): ${e.message}`
          )
        )
      )
    );

    console.log(
      `[Notification] Task-blocked emails sent to ${members.length} member(s) for task "${task.title}".`
    );
  } catch (err) {
    console.error('[Notification] sendTaskBlockedNotification error:', err.message);
  }
};

module.exports = { sendTaskAssignedNotification, sendTaskCompletedNotification, sendTaskBlockedNotification };
