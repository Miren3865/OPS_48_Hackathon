const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Team = require('../models/Team');
const ChatMessage = require('../models/ChatMessage');
const { sendMentionEmail } = require('../utils/mailer');

/**
 * Socket.IO event handler
 * Manages real-time team rooms and event broadcasting
 */
const initSocket = (io) => {
  // Authenticate socket connections via JWT query param
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // Join a team room — client sends teamId after connecting
    socket.on('join:team', (teamId) => {
      socket.join(teamId);
      console.log(`👥 ${socket.user.name} joined room: ${teamId}`);

      // Notify other team members
      socket.to(teamId).emit('user:joined', {
        userId: socket.user._id,
        name: socket.user.name,
      });
    });

    // Leave a team room
    socket.on('leave:team', (teamId) => {
      socket.leave(teamId);
      console.log(`👋 ${socket.user.name} left room: ${teamId}`);
    });

    // Join team room for chat (aliased event name used by ChatPanel)
    socket.on('joinTeamRoom', (teamId) => {
      socket.join(teamId);
      console.log(`💬 ${socket.user.name} joined chat room: ${teamId}`);
    });

    // Real-time chat message
    socket.on('sendMessage', async ({ teamId, message, mentions: rawMentions = [] }, ack) => {
      try {
        if (!teamId || !message?.trim()) return;

        // Validate that mentioned IDs actually belong to this team
        let validMentionIds = [];
        if (rawMentions.length) {
          const team = await Team.findById(teamId).select('members name');
          if (team) {
            const memberIdSet = new Set(team.members.map((m) => String(m.user)));
            validMentionIds = rawMentions
              .map(String)
              .filter((id) => memberIdSet.has(id))
              // Do not include self-mentions
              .filter((id) => id !== String(socket.user._id));
          }
        }

        const saved = await ChatMessage.create({
          team: teamId,
          sender: socket.user._id,
          message: message.trim(),
          mentions: validMentionIds,
        });

        // Populate sender name + mentions name/email for broadcast and emails
        const populated = await saved.populate([
          { path: 'sender',   select: 'name' },
          { path: 'mentions', select: 'name email' },
        ]);

        io.to(teamId).emit('receiveMessage', populated);

        if (typeof ack === 'function') ack();

        // Fire-and-forget mention emails (batch)
        if (populated.mentions?.length) {
          const team = await Team.findById(teamId).select('name');
          const teamName = team?.name || 'your team';
          await Promise.all(
            populated.mentions.map((mentionedUser) =>
              sendMentionEmail(
                mentionedUser.email,
                mentionedUser.name,
                socket.user.name,
                teamName,
                teamId,
                populated.message
              ).catch((err) =>
                console.error(`Mention email failed for ${mentionedUser.email}:`, err.message)
              )
            )
          );
        }
      } catch (err) {
        console.error('sendMessage error:', err);
      }
    });

    // Client can emit a "ping" to check connectivity
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb({ status: 'ok' });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = initSocket;
