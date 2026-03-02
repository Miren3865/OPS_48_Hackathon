const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { calculateRiskRadar } = require('../utils/riskRadar');
const { canTransition } = require('../middleware/validateTransition');
const { sendTaskAssignmentEmail } = require('../utils/mailer');
const {
  sendTaskAssignedNotification,
  sendTaskCompletedNotification,
  sendTaskBlockedNotification,
} = require('../services/notificationService');

const router = express.Router();

router.use(protect);

// Helper: Check if user is a member of the team
const isTeamMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return false;
  return team.members.some((m) => m.user.toString() === userId.toString());
};

// Helper: Get user's role in a team
const getMemberRole = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return null;
  const m = team.members.find((m) => m.user.toString() === userId.toString());
  return m ? m.role : null;
};

// Helper: Check if user can create tasks in a team
// Returns true if admin or canCreateTask === true
const canUserCreateTask = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) return false;
  const m = team.members.find((m) => m.user.toString() === userId.toString());
  if (!m) return false;
  return m.role === 'admin' || m.canCreateTask === true;
};

// @route  GET /api/tasks/:teamId
// @desc   Get all tasks for a team
// @access Private (team member)
router.get('/:teamId', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const tasks = await Task.find({ team: req.params.teamId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .populate('blockedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/tasks/:teamId
// @desc   Create a new task
// @access Private (team member)
router.post(
  '/:teamId',
  [body('title').trim().notEmpty().withMessage('Task title is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      if (!(await isTeamMember(req.params.teamId, req.user._id))) {
        return res.status(403).json({ message: 'Not a team member' });
      }

      if (!(await canUserCreateTask(req.params.teamId, req.user._id))) {
        return res.status(403).json({ message: 'You do not have permission to create tasks.' });
      }

      const { title, description, assignedTo, deadline, priority } = req.body;

      // Validate assignedTo belongs to this team; only admins may assign to another admin
      if (assignedTo) {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        const targetMember = team.members.find((m) => m.user.toString() === assignedTo.toString());
        if (!targetMember) {
          return res.status(400).json({ message: 'Assigned user is not a member of this team' });
        }
        if (targetMember.role === 'admin') {
          const actorRole = await getMemberRole(req.params.teamId, req.user._id);
          if (actorRole !== 'admin') {
            return res.status(403).json({ message: 'Only admins can assign tasks to another admin' });
          }
        }
      }

      // Always force new tasks to To-Do — client cannot set initial status
      const task = await Task.create({
        title,
        description: description || '',
        assignedTo: assignedTo || null,
        deadline: deadline || null,
        priority: priority || 'medium',
        status: 'todo',
        team: req.params.teamId,
        createdBy: req.user._id,
      });

      const populated = await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name' },
      ]);

      // ── Activity log ──────────────────────────────────────────────────────
      const assigneeNameForLog = populated.assignedTo?.name || null;
      const createLogAction = assigneeNameForLog
        ? `created task "${task.title}" assigned to ${assigneeNameForLog} — admins notified`
        : `created task "${task.title}"`;

      await ActivityLog.create({
        team: req.params.teamId,
        user: req.user._id,
        action: createLogAction,
        entityType: 'task',
        entityId: task._id,
        entityTitle: task.title,
      });

      // ── Send assignment email to assignee (skip if assigning to self) ─────
      if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
        try {
          const assignee = await User.findById(assignedTo).select('name email');
          if (assignee?.email) {
            await sendTaskAssignmentEmail(
              assignee.email,
              assignee.name,
              task.title,
              task.deadline,
              req.params.teamId
            );
          }
        } catch (mailErr) {
          console.error('Assignment email failed (non-fatal):', mailErr.message);
        }

        // ── Notify all admins (non-blocking) ─────────────────────────────
        setImmediate(() =>
          sendTaskAssignedNotification(
            populated,
            req.params.teamId,
            req.user.name || 'Someone'
          )
        );
      }

      // Emit socket event (accessed via req.app)
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.teamId).emit('task:created', populated);
        try {
          const riskReport = await calculateRiskRadar(req.params.teamId);
          io.to(req.params.teamId).emit('risk:updated', riskReport);
        } catch (e) { /* non-fatal */ }
      }

      res.status(201).json(populated);
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route  PUT /api/tasks/:teamId/:taskId
// @desc   Update a task (status, fields, blocker)
// @access Private (team member)
router.put('/:teamId/:taskId', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const task = await Task.findOne({
      _id: req.params.taskId,
      team: req.params.teamId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo?.toString() || null;
    const {
      title,
      description,
      assignedTo,
      deadline,
      priority,
      status,
      blockerReason,
    } = req.body;

    // Validate assignedTo belongs to team; only admins may assign to another admin
    if (assignedTo !== undefined && assignedTo !== null && assignedTo !== '') {
      const team = await Team.findById(req.params.teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });
      const targetMember = team.members.find((m) => m.user.toString() === assignedTo.toString());
      if (!targetMember) {
        return res.status(400).json({ message: 'Assigned user is not a member of this team' });
      }
      if (targetMember.role === 'admin') {
        const actorRole = await getMemberRole(req.params.teamId, req.user._id);
        if (actorRole !== 'admin') {
          return res.status(403).json({ message: 'Only admins can assign tasks to another admin' });
        }
      }
    }

    // ── Ownership guard on status transition ─────────────────────────────
    if (status !== undefined && status !== oldStatus) {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
        const role = await getMemberRole(req.params.teamId, req.user._id);
        if (role !== 'admin') {
          return res.status(403).json({
            message: 'Only the assigned member can change this task\'s status.',
            code: 'NOT_ASSIGNED',
          });
        }
      }
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (deadline !== undefined) task.deadline = deadline;
    if (priority !== undefined) task.priority = priority;

    // Handle status change
    if (status !== undefined && status !== oldStatus) {
      // ── Workflow transition guard ────────────────────────────────────────
      if (!canTransition(oldStatus, status)) {
        const labels = { todo: 'To-Do', inprogress: 'In Progress', completed: 'Completed', blocked: 'Blocked' };
        return res.status(400).json({
          message: `Invalid workflow transition: "${labels[oldStatus] || oldStatus}" → "${labels[status] || status}". Tasks must follow the execution workflow.`,
          code: 'INVALID_TRANSITION',
        });
      }
      if (status === 'blocked' && (!blockerReason || !blockerReason.trim())) {
        return res.status(400).json({
          message: 'A blocker reason is required when marking a task as Blocked.',
          code: 'BLOCKER_REASON_REQUIRED',
        });
      }
      // ─────────────────────────────────────────────────────────────────────

      task.status = status;

      if (status === 'blocked') {
        task.blockerReason = blockerReason || 'No reason provided';
        task.blockedBy = req.user._id;
        task.blockedAt = new Date();
      } else {
        // Clear blocker fields when unblocking
        task.blockerReason = '';
        task.blockedBy = null;
        task.blockedAt = null;
      }
      // Track when a task is completed — for burndown/velocity chart
      if (status === 'completed') {
        task.completedAt = new Date();
      } else if (task.completedAt) {
        task.completedAt = null; // reset if moved back from completed
      }
    }

    await task.save();

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name' },
      { path: 'blockedBy', select: 'name' },
    ]);

    // ── Flags for notification triggers ──────────────────────────────────
    const assignmentChanged =
      assignedTo !== undefined &&
      assignedTo !== null &&
      assignedTo.toString() !== oldAssignedTo;

    const justCompleted =
      status !== undefined &&
      status === 'completed' &&
      oldStatus !== 'completed';

    const justBlocked =
      status !== undefined &&
      status === 'blocked' &&
      oldStatus !== 'blocked';

    // ── Determine activity log action string ──────────────────────────────
    let action = `updated task "${task.title}"`;
    if (status && status !== oldStatus) {
      const statusLabel = {
        todo: 'To-Do',
        inprogress: 'In Progress',
        completed: 'Completed',
        blocked: 'Blocked',
      };
      action = `moved "${task.title}" to ${statusLabel[status] || status}`;
      if (status === 'blocked') {
        action += ` (${task.blockerReason})`;
      }
      if (justCompleted) {
        action = `completed "${task.title}" \u2014 team notified`;
      }      if (justBlocked) {
        action = `blocked "${task.title}" (${task.blockerReason}) — team notified`;
      }    } else if (assignmentChanged) {
      const newAssigneeName = populated.assignedTo?.name || 'a member';
      action = `assigned "${task.title}" to ${newAssigneeName} \u2014 admins notified`;
    }

    await ActivityLog.create({
      team: req.params.teamId,
      user: req.user._id,
      action,
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
    });

    // ── Send assignment email to new assignee (skip if assigning to self) ─
    if (assignmentChanged && assignedTo.toString() !== req.user._id.toString()) {
      try {
        const assignee = await User.findById(assignedTo).select('name email');
        if (assignee?.email) {
          await sendTaskAssignmentEmail(
            assignee.email,
            assignee.name,
            task.title,
            task.deadline,
            req.params.teamId
          );
        }
      } catch (mailErr) {
        console.error('Assignment email failed (non-fatal):', mailErr.message);
      }

      // Notify all admins — non-blocking
      setImmediate(() =>
        sendTaskAssignedNotification(
          populated,
          req.params.teamId,
          req.user.name || 'Someone'
        )
      );
    }

    // ── Notify all members on task completion — non-blocking ──────────────
    if (justCompleted) {
      setImmediate(() =>
        sendTaskCompletedNotification(
          populated,
          req.params.teamId,
          req.user.name || 'Someone'
        )
      );
    }

    // ── Notify all members when task is blocked — non-blocking ────────────
    if (justBlocked) {
      setImmediate(() =>
        sendTaskBlockedNotification(
          populated,
          req.params.teamId,
          req.user.name || 'Someone',
          task.blockerReason
        )
      );
    }

    // Emit real-time update to team room
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.teamId).emit('task:updated', populated);
      try {
        const riskReport = await calculateRiskRadar(req.params.teamId);
        io.to(req.params.teamId).emit('risk:updated', riskReport);
      } catch (e) { /* non-fatal */ }
    }

    res.json(populated);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/tasks/:teamId/:taskId/unblock
// @desc   Unblock a task — admin only (moves it back to To-Do)
// @access Private (admin)
router.put('/:teamId/:taskId/unblock', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const role = await getMemberRole(req.params.teamId, req.user._id);
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can unblock tasks' });
    }

    const task = await Task.findOne({
      _id: req.params.taskId,
      team: req.params.teamId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.status !== 'blocked') {
      return res.status(400).json({
        message: 'Only blocked tasks can be unblocked.',
        code: 'NOT_BLOCKED',
      });
    }

    task.status = 'todo';
    task.blockerReason = '';
    task.blockedBy = null;
    task.blockedAt = null;
    await task.save();

    await ActivityLog.create({
      team: req.params.teamId,
      user: req.user._id,
      action: `unblocked "${task.title}" — moved back to To-Do`,
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name' },
      { path: 'blockedBy', select: 'name' },
    ]);

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.teamId).emit('task:updated', populated);
      try {
        const riskReport = await calculateRiskRadar(req.params.teamId);
        io.to(req.params.teamId).emit('risk:updated', riskReport);
      } catch (e) { /* non-fatal */ }
    }

    res.json(populated);
  } catch (error) {
    console.error('Unblock task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/tasks/:teamId/:taskId
// @desc   Delete a completed task (admin only)
// @access Private
router.delete('/:teamId/:taskId', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const task = await Task.findOne({
      _id: req.params.taskId,
      team: req.params.teamId,
    });

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const role = await getMemberRole(req.params.teamId, req.user._id);

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed tasks can be deleted' });
    }

    const taskTitle = task.title;
    await task.deleteOne();

    await ActivityLog.create({
      team: req.params.teamId,
      user: req.user._id,
      action: `deleted task "${taskTitle}"`,
      entityType: 'task',
      entityId: req.params.taskId,
      entityTitle: taskTitle,
    });

    // Emit deletion event
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.teamId).emit('task:deleted', {
        taskId: req.params.taskId,
      });
      try {
        const riskReport = await calculateRiskRadar(req.params.teamId);
        io.to(req.params.teamId).emit('risk:updated', riskReport);
      } catch (e) { /* non-fatal */ }
    }

    res.json({ message: 'Task deleted', taskId: req.params.taskId });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/tasks/:teamId/burndown
// @desc   Returns a 14-day burndown dataset for velocity/progress chart
// @access Private (team member)
router.get('/:teamId/burndown', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const now = new Date();
    const days = 14;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const tasks = await Task.find({ team: req.params.teamId }).select(
      'status createdAt completedAt updatedAt'
    );

    // Build per-day data
    const data = [];
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Tasks that existed (created on or before end of this day)
      const created = tasks.filter(
        (t) => new Date(t.createdAt) <= dayEnd
      ).length;

      // Tasks completed on or before end of this day
      const completed = tasks.filter((t) => {
        if (t.status !== 'completed') return false;
        const doneAt = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
        return doneAt <= dayEnd;
      }).length;

      data.push({
        date: dayStart.toISOString().slice(0, 10),
        label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        completed,
        remaining: Math.max(0, created - completed),
      });
    }

    res.json({ data, totalTasks: tasks.length });
  } catch (error) {
    console.error('Burndown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/tasks/:teamId/:taskId/comments
// @desc   Get all comments on a task
// @access Private (team member)
router.get('/:teamId/:taskId/comments', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/tasks/:teamId/:taskId/comments
// @desc   Add a comment to a task
// @access Private (team member)
router.post(
  '/:teamId/:taskId/comments',
  [body('text').trim().notEmpty().withMessage('Comment text is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      if (!(await isTeamMember(req.params.teamId, req.user._id))) {
        return res.status(403).json({ message: 'Not a team member' });
      }

      const task = await Task.findOne({
        _id: req.params.taskId,
        team: req.params.teamId,
      });
      if (!task) return res.status(404).json({ message: 'Task not found' });

      const Comment = require('../models/Comment');
      const comment = await Comment.create({
        task: req.params.taskId,
        team: req.params.teamId,
        author: req.user._id,
        text: req.body.text.trim(),
      });

      const populated = await comment.populate('author', 'name');

      // Broadcast to team room so all open task modals update live
      const io = req.app.get('io');
      if (io) {
        io.to(req.params.teamId).emit('comment:added', {
          taskId: req.params.taskId,
          comment: populated,
        });
      }

      res.status(201).json(populated);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
