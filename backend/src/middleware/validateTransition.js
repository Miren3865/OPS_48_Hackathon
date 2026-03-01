/**
 * Workflow Transition Rules
 *
 * allowed[from] = array of valid "to" statuses
 *
 * todo       → inprogress, blocked
 * inprogress → completed,  blocked
 * completed  → blocked
 * blocked    → (none — terminal)
 */
const ALLOWED = {
  todo:       ['inprogress', 'blocked'],
  inprogress: ['completed',  'blocked'],
  completed:  ['blocked'],
  blocked:    [],
};

const STATUS_LABELS = {
  todo:       'To-Do',
  inprogress: 'In Progress',
  completed:  'Completed',
  blocked:    'Blocked',
};

/** Pure helper — usable on both backend and (copy) frontend */
const canTransition = (from, to) =>
  Array.isArray(ALLOWED[from]) && ALLOWED[from].includes(to);

/**
 * Express middleware.
 * Expects req.task to be pre-fetched (current status at req.task.status).
 * Call AFTER the task has been loaded and attached to req.
 */
const validateTransitionMiddleware = (req, res, next) => {
  const { status: toStatus, blockerReason } = req.body;
  const fromStatus = req.task?.status;

  if (!toStatus || toStatus === fromStatus) return next(); // no change → skip

  if (!canTransition(fromStatus, toStatus)) {
    return res.status(400).json({
      message: `Invalid workflow transition: "${STATUS_LABELS[fromStatus] || fromStatus}" → "${STATUS_LABELS[toStatus] || toStatus}". Tasks must follow the execution workflow.`,
      code: 'INVALID_TRANSITION',
    });
  }

  if (toStatus === 'blocked' && (!blockerReason || !blockerReason.trim())) {
    return res.status(400).json({
      message: 'A blocker reason is required when marking a task as Blocked.',
      code: 'BLOCKER_REASON_REQUIRED',
    });
  }

  next();
};

module.exports = { validateTransitionMiddleware, canTransition, ALLOWED };
