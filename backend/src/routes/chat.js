const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');

/**
 * GET /api/chat/:teamId
 * Fetch the last 100 messages for a team, sorted oldest → newest
 */
router.get('/:teamId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ team: req.params.teamId })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate('sender', 'name')
      .populate('mentions', 'name');

    res.json(messages);
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

module.exports = router;
