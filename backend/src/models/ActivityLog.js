const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. "created task", "moved task to In Progress", "marked as Blocked"
    },
    entityType: {
      type: String,
      enum: ['task', 'team', 'member'],
      default: 'task',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    entityTitle: {
      type: String,
      default: '',
    },
    meta: {
      type: mongoose.Schema.Types.Mixed, // Extra data if needed
      default: {},
    },
  },
  { timestamps: true }
);

// Index for fast team timeline queries
ActivityLogSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
