const express = require('express');
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');
const { generateStandup } = require('../utils/standupGenerator');

const router = express.Router();
router.use(protect);

// Helper: Verify user is a team member
const isTeamMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  return team?.members.some((m) => m.user.toString() === userId.toString()) ?? false;
};

// @route  GET /api/standup/:teamId
// @desc   One-click standup report generation for a team
// @access Private (team member)
router.get('/:teamId', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const report = await generateStandup(req.params.teamId);
    res.json(report);
  } catch (error) {
    console.error('Standup generation error:', error);
    res.status(500).json({ message: 'Failed to generate standup' });
  }
});

module.exports = router;
