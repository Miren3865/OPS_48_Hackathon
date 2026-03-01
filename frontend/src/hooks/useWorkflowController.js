import { useState, useCallback, useRef } from 'react';
import { useTeam } from '../context/TeamContext';

// ─── Transition Rules (mirrors backend) ──────────────────────────────────────
export const ALLOWED_TRANSITIONS = {
  todo:       ['inprogress', 'blocked'],
  inprogress: ['completed',  'blocked'],
  completed:  ['blocked'],
  blocked:    [],
};

export const canTransition = (from, to) =>
  Array.isArray(ALLOWED_TRANSITIONS[from]) && ALLOWED_TRANSITIONS[from].includes(to);

// ─── Label map ────────────────────────────────────────────────────────────────
const LABELS = { todo: 'To-Do', inprogress: 'In Progress', completed: 'Completed', blocked: 'Blocked' };

/**
 * useWorkflowController
 *
 * Manages all drag-and-drop + workflow transition logic.
 *
 * Returns:
 *   DnD handlers      — handleDragStart, handleDragEnd, handleDragCancel
 *   activeTask        — task being dragged (for DragOverlay)
 *   Blocker modal     — blockerModal, handleBlockedConfirm, handleBlockedCancel
 *   Toast             — toast
 *   Shake             — shakeCol
 */
export function useWorkflowController() {
  const { updateTask } = useTeam();

  // Currently dragged task
  const [activeTask, setActiveTask] = useState(null);

  // Pending blocked drop — { task, toStatus }
  const [blockerModal, setBlockerModal] = useState(null);

  // Toast — { message, type: 'error'|'success'|'info' } | null
  const [toast, setToast] = useState(null);
  const toastRef = useRef(null);

  // Column id to shake briefly on invalid drop
  const [shakeCol, setShakeCol] = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'error', ms = 3500) => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ message, type });
    toastRef.current = setTimeout(() => setToast(null), ms);
  }, []);

  const triggerShake = useCallback((colId) => {
    setShakeCol(colId);
    setTimeout(() => setShakeCol(null), 520);
  }, []);

  // ── DnD events ────────────────────────────────────────────────────────────
  const handleDragStart = useCallback((event) => {
    const task = event.active?.data?.current?.task;
    setActiveTask(task ?? null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = active?.data?.current?.task;
    const toStatus = over.id; // droppable id === column status key

    if (!task || task.status === toStatus) return;

    if (!canTransition(task.status, toStatus)) {
      triggerShake(toStatus);
      showToast(
        `Invalid transition. Tasks must follow execution workflow.`,
        'error'
      );
      return;
    }

    // Blocked → need a reason
    if (toStatus === 'blocked') {
      setBlockerModal({ task, toStatus });
      return;
    }

    // Valid non-blocked transition
    try {
      await updateTask(task._id, { status: toStatus });
      if (toStatus === 'completed') {
        showToast(`✅  "${task.title}" moved to Completed!`, 'success', 2800);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Status update failed.';
      showToast(msg, 'error');
    }
  }, [updateTask, showToast, triggerShake]);

  // ── Blocker modal callbacks ────────────────────────────────────────────────
  const handleBlockedConfirm = useCallback(async (reason) => {
    if (!blockerModal) return;
    const { task } = blockerModal;
    setBlockerModal(null);
    try {
      await updateTask(task._id, { status: 'blocked', blockerReason: reason.trim() });
      showToast(`🚧  "${task.title}" marked as Blocked.`, 'info', 2800);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to mark as blocked.';
      showToast(msg, 'error');
    }
  }, [blockerModal, updateTask, showToast]);

  const handleBlockedCancel = useCallback(() => {
    setBlockerModal(null);
    showToast('Move cancelled.', 'info', 2000);
  }, [showToast]);

  return {
    // DnD
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeTask,
    // Modals
    blockerModal,
    handleBlockedConfirm,
    handleBlockedCancel,
    // Feedback
    toast,
    shakeCol,
  };
}
