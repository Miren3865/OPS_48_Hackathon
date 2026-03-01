const express = require('express');
const Team = require('../models/Team');
const { protect } = require('../middleware/auth');
const { calculateRiskRadar } = require('../utils/riskRadar');

const router = express.Router();
router.use(protect);

// Helper: Verify user is a team member
const isTeamMember = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  return team?.members.some((m) => m.user.toString() === userId.toString()) ?? false;
};

// @route  GET /api/risk/:teamId
// @desc   Get current Execution Risk Radar report for a team
// @access Private (team member)
router.get('/:teamId', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const report = await calculateRiskRadar(req.params.teamId);
    res.json(report);
  } catch (error) {
    console.error('Risk radar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route  POST /api/risk/:teamId/broadcast
// @desc   Recalculate risk and broadcast to all connected team members
// @desc   Called automatically after task mutations (internal or via client)
// @access Private (team member)
router.post('/:teamId/broadcast', async (req, res) => {
  try {
    if (!(await isTeamMember(req.params.teamId, req.user._id))) {
      return res.status(403).json({ message: 'Not a team member' });
    }

    const report = await calculateRiskRadar(req.params.teamId);

    // Emit updated risk score to all team members in real time
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.teamId).emit('risk:updated', report);
    }

    res.json(report);
  } catch (error) {
    console.error('Risk broadcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
