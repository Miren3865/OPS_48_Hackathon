const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { calculateRiskRadar } = require('../utils/riskRadar');
const { canTransition } = require('../middleware/validateTransition');

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

      const { title, description, assignedTo, deadline, priority, status } =
        req.body;

      const task = await Task.create({
        title,
        description: description || '',
        assignedTo: assignedTo || null,
        deadline: deadline || null,
        priority: priority || 'medium',
        status: status || 'todo',
        team: req.params.teamId,
        createdBy: req.user._id,
      });

      // Log the activity
      await ActivityLog.create({
        team: req.params.teamId,
        user: req.user._id,
        action: `created task "${task.title}"`,
        entityType: 'task',
        entityId: task._id,
        entityTitle: task.title,
      });

      const populated = await task.populate([
        { path: 'assignedTo', select: 'name email' },
        { path: 'createdBy', select: 'name' },
      ]);

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
    const {
      title,
      description,
      assignedTo,
      deadline,
      priority,
      status,
      blockerReason,
    } = req.body;

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
    }

    await task.save();

    // Determine action string for log
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
    }

    await ActivityLog.create({
      team: req.params.teamId,
      user: req.user._id,
      action,
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name' },
      { path: 'blockedBy', select: 'name' },
    ]);

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
// @desc   Unblock a task — moves it back to To-Do and clears blocker data
// @access Private (team member)
router.put('/:teamId/:taskId/unblock', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
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
// @desc   Delete a task (admin or creator)
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
    const isCreator = task.createdBy.toString() === req.user._id.toString();

    if (role !== 'admin' && !isCreator) {
      return res
        .status(403)
        .json({ message: 'Only admins or task creators can delete tasks' });
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

module.exports = router;
