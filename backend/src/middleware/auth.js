const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — verifies JWT from Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

/**
 * Restrict access to team admin role
 * Must be used AFTER protect middleware
 */
const requireAdmin = (teamId) => async (req, res, next) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findById(teamId || req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const memberEntry = team.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!memberEntry || memberEntry.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.team = team;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { protect, requireAdmin };
