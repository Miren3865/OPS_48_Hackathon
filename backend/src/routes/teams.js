const express = require('express');
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/auth');

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

module.exports = router;
