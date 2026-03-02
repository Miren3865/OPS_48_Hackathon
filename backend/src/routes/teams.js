const express = require('express');
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');
const { sendTaskPermissionEmail, sendTaskPermissionRevokedEmail } = require('../utils/mailer');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route  POST /api/teams
// @desc   Create a new team (creator becomes admin)
// @access Private
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Team name is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;

      const team = await Team.create({
        name,
        description: description || '',
        createdBy: req.user._id,
        members: [{ user: req.user._id, role: 'admin' }],
      });

      // Add team to user's teams list
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { teams: team._id },
      });

      // Log activity
      await ActivityLog.create({
        team: team._id,
        user: req.user._id,
        action: `created team "${team.name}"`,
        entityType: 'team',
        entityId: team._id,
        entityTitle: team.name,
      });

      const populated = await team.populate('members.user', 'name email');
      res.status(201).json(populated);
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route  POST /api/teams/join
// @desc   Join a team using invite code
// @access Private
router.post(
  '/join',
  [body('inviteCode').trim().notEmpty().withMessage('Invite code required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { inviteCode } = req.body;
      const team = await Team.findOne({
        inviteCode: inviteCode.toUpperCase(),
      });

      if (!team) {
        return res.status(404).json({ message: 'Invalid invite code' });
      }

      // Check if already a member
      const isMember = team.members.some(
        (m) => m.user.toString() === req.user._id.toString()
      );
      if (isMember) {
        return res.status(400).json({ message: 'Already a member of this team' });
      }

      // Add to team
      team.members.push({ user: req.user._id, role: 'member' });
      await team.save();

      // Add team reference to user
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { teams: team._id },
      });

      await ActivityLog.create({
        team: team._id,
        user: req.user._id,
        action: `joined the team`,
        entityType: 'member',
        entityId: req.user._id,
        entityTitle: req.user.name,
      });

      const populated = await team.populate('members.user', 'name email');
      res.json(populated);
    } catch (error) {
      console.error('Join team error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route  GET /api/teams/:teamId
// @desc   Get team details with members
// @access Private (team member only)
router.get('/:teamId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate(
      'members.user',
      'name email'
    );

    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isMember = team.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember)
      return res.status(403).json({ message: 'Not a team member' });

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  GET /api/teams/:teamId/activity
// @desc   Get activity log for a team (latest 50 entries)
// @access Private (team member)
router.get('/:teamId/activity', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isMember = team.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember)
      return res.status(403).json({ message: 'Not a team member' });

    const logs = await ActivityLog.find({ team: req.params.teamId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/teams/:teamId/members/:userId/role
// @desc   Change member role (admin only)
// @access Private (admin)
router.put('/:teamId/members/:userId/role', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only admin can change roles
    const requester = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const targetMember = team.members.find(
      (m) => m.user.toString() === req.params.userId
    );
    if (!targetMember) {
      return res.status(404).json({ message: 'Member not found in team' });
    }

    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    targetMember.role = role;
    await team.save();

    const populated = await team.populate('members.user', 'name email');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  PUT /api/teams/:teamId/permissions/:memberId
// @desc   Grant or revoke task-creation permission for a member (admin only)
// @access Private (admin)
router.put('/:teamId/permissions/:memberId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Only admin can adjust permissions
    const requester = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const targetMember = team.members.find(
      (m) => m.user.toString() === req.params.memberId
    );
    if (!targetMember) {
      return res.status(404).json({ message: 'Member not found in team' });
    }

    // Admins always have task-creation permission — silently ignore attempts to demote
    if (targetMember.role === 'admin') {
      const populated = await team.populate('members.user', 'name email');
      return res.json(populated);
    }

    const { canCreateTask } = req.body;
    if (typeof canCreateTask !== 'boolean') {
      return res.status(400).json({ message: 'canCreateTask must be a boolean' });
    }

    targetMember.canCreateTask = canCreateTask;
    await team.save();

    // Resolve target user name for activity log
    const targetUser = await User.findById(req.params.memberId).select('name');
    const action = canCreateTask
      ? `granted task creation permission to ${targetUser?.name ?? 'a member'}`
      : `revoked task creation permission from ${targetUser?.name ?? 'a member'}`;

    await ActivityLog.create({
      team: team._id,
      user: req.user._id,
      action,
      entityType: 'member',
      entityId: targetMember.user,
      entityTitle: targetUser?.name ?? '',
    });

    const populated = await team.populate('members.user', 'name email');

    // Notify all team members in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(team._id.toString()).emit('team:permissionUpdated', populated);
    }

    // Send email to the member on grant or revoke (non-fatal)
    try {
      const targetUserFull = await User.findById(req.params.memberId).select('name email');
      const adminUser = await User.findById(req.user._id).select('name');
      if (targetUserFull?.email) {
        if (canCreateTask) {
          await sendTaskPermissionEmail(
            targetUserFull.email,
            targetUserFull.name,
            adminUser?.name ?? 'Your admin',
            team.name,
            team._id.toString()
          );
        } else {
          await sendTaskPermissionRevokedEmail(
            targetUserFull.email,
            targetUserFull.name,
            adminUser?.name ?? 'Your admin',
            team.name,
            team._id.toString()
          );
        }
      }
    } catch (mailErr) {
      console.error('Permission email failed (non-fatal):', mailErr.message);
    }

    res.json(populated);
  } catch (error) {
    console.error('Update permission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/teams/:teamId
// @desc   Delete a single team and all its tasks/logs (admin only)
// @access Private (admin)
router.delete('/:teamId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const requester = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'Only team admins can delete a team' });
    }

    // Remove team ref from all member users
    const memberIds = team.members.map((m) => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { teams: team._id } }
    );

    // Delete tasks and activity logs belonging to this team
    await Task.deleteMany({ team: team._id });
    await ActivityLog.deleteMany({ team: team._id });

    await team.deleteOne();

    res.json({ message: `Team "${team.name}" deleted successfully`, teamId: req.params.teamId });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  DELETE /api/teams
// @desc   Delete ALL teams where the current user is admin
// @access Private
router.delete('/', async (req, res) => {
  try {
    const adminTeams = await Team.find({
      members: { $elemMatch: { user: req.user._id, role: 'admin' } },
    });

    if (adminTeams.length === 0) {
      return res.json({ message: 'No teams to delete', deleted: 0 });
    }

    const teamIds = adminTeams.map((t) => t._id);

    // Remove team refs from ALL members of those teams
    const allMemberIds = adminTeams.flatMap((t) => t.members.map((m) => m.user));
    await User.updateMany(
      { _id: { $in: allMemberIds } },
      { $pull: { teams: { $in: teamIds } } }
    );

    await Task.deleteMany({ team: { $in: teamIds } });
    await ActivityLog.deleteMany({ team: { $in: teamIds } });
    await Team.deleteMany({ _id: { $in: teamIds } });

    res.json({ message: `${adminTeams.length} team(s) deleted successfully`, deleted: adminTeams.length });
  } catch (error) {
    console.error('Delete all teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
