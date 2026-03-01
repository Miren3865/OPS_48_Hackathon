import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';

import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskModal from '../tasks/TaskModal';
import BlockReasonModal from './BlockReasonModal';
import SelectTaskModal from './SelectTaskModal';
import ConfirmModal from '../common/ConfirmModal';
import { useTeam } from '../../context/TeamContext';
import { useAuth } from '../../context/AuthContext';
import { useWorkflowController } from '../../hooks/useWorkflowController';

const COLUMNS = ['todo', 'inprogress', 'completed', 'blocked'];

const TOAST_LOOK = {
  error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.45)'  },
  success: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.45)' },
  info:    { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.45)' },
};

export default function KanbanBoard() {
  const { tasks, currentTeam, createTask, updateTask, deleteTask, unblockTask } = useTeam();
  const { user } = useAuth();

  // Derive current user's role in this team
  const isAdmin = currentTeam?.members?.some(
    (m) => m.user?._id === user?._id && m.role === 'admin'
  ) ?? false;

  // ── Task edit/create modal ────────────────────────────────────────
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingTask, setEditingTask]   = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Select-task modal (for In-Progress / Completed / Blocked + buttons) ──
  const [selectModal, setSelectModal] = useState(null);
  // { targetStatus, sourceTasks }

  // ── Unblock confirm modal ─────────────────────────────────────────────────
  const [unblockConfirm, setUnblockConfirm] = useState(null); // { task } | null
  const [unblocking, setUnblocking]         = useState(false);

  // ── Unblock handlers ──────────────────────────────────────────────────────
  const handleUnblockClick = (task) => setUnblockConfirm({ task });

  const handleUnblockConfirm = async () => {
    if (!unblockConfirm) return;
    setUnblocking(true);
    try {
      await unblockTask(unblockConfirm.task._id);
      setUnblockConfirm(null);
      // Show success toast via workflow controller's showToast if available,
      // or fall back to a local one-shot approach using the existing toast state.
      // We reuse the same toast element already rendered in KanbanBoard:
      _showUnblockToast();
    } catch (err) {
      console.error('Unblock failed:', err);
    } finally {
      setUnblocking(false);
    }
  };

  const [unblockToast, setUnblockToast] = useState(false);
  const _showUnblockToast = () => {
    setUnblockToast(true);
    setTimeout(() => setUnblockToast(false), 3500);
  };

  // ── Drag-and-drop workflow ──────────────────────────────────
  const {
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeTask,
    blockerModal,
    handleBlockedConfirm,
    handleBlockedCancel,
    toast,
    shakeCol,
  } = useWorkflowController();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // ── Add Task button control logic ──────────────────────────────
  const handleAddTask = (columnStatus) => {
    if (columnStatus === 'todo') {
      // Normal create
      setEditingTask(null);
      setDefaultStatus('todo');
      setModalOpen(true);
      return;
    }

    // Determine eligible source tasks based on destination column
    const sourceStatuses =
      columnStatus === 'inprogress' ? ['todo'] :
      columnStatus === 'completed'  ? ['inprogress'] :
      /* blocked */                   ['todo', 'inprogress', 'completed'];

    const sourceTasks = tasks.filter((t) => sourceStatuses.includes(t.status));
    setSelectModal({ targetStatus: columnStatus, sourceTasks });
  };

  // Called when user picks a task from SelectTaskModal
  const handleSelectTask = async (selectedTask) => {
    const { targetStatus } = selectModal;
    setSelectModal(null);

    if (targetStatus === 'blocked') {
      // Need blocker reason — open BlockReasonModal via workflow controller state
      // We fake a "pending drop" by directly setting state in the controller is not
      // possible externally, so we handle it locally here:
      setPendingBlockViaButton({ task: selectedTask });
    } else {
      try {
        await updateTask(selectedTask._id, { status: targetStatus });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Local state for block-via-button flow
  const [pendingBlockViaButton, setPendingBlockViaButton] = useState(null);
  const handleButtonBlockConfirm = async (reason) => {
    if (!pendingBlockViaButton) return;
    const { task } = pendingBlockViaButton;
    setPendingBlockViaButton(null);
    try {
      await updateTask(task._id, { status: 'blocked', blockerReason: reason.trim() });
    } catch (err) {
      console.error(err);
    }
  };

  // ── Task CRUD ──────────────────────────────────────────────────
  const handleEditTask = (task) => {
    setEditingTask(task);
    setDefaultStatus(task.status);
    setModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (editingTask) {
      await updateTask(editingTask._id, formData);
    } else {
      await createTask(formData);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (deleteConfirm === taskId) {
      await deleteTask(taskId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(taskId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const tasksByStatus = COLUMNS.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {});

  const members = currentTeam?.members || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>

      {/* ── DnD Board ────────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(256px, 1fr))',
            gap: '0.875rem',
            flex: 1,
            minHeight: 0,
            paddingBottom: '0.5rem',
          }}
        >
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
              onUnblockTask={handleUnblockClick}
              currentUserId={user?._id}
              activeDragStatus={activeTask?.status ?? null}
              isShaking={shakeCol === status}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {/* Drag ghost */}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div style={{ opacity: 0.85, transform: 'rotate(1.8deg)', pointerEvents: 'none' }}>
              <TaskCard
                task={activeTask}
                columnAccent="#6366f1"
                onEdit={() => {}}
                onDelete={() => {}}
                currentUserId={user?._id}
                isDragOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Unblock confirmation modal ───────────────────────────── */}
      <ConfirmModal
        isOpen={!!unblockConfirm}
        title="Unblock this task?"
        message={`"${unblockConfirm?.task?.title}" will be moved back to To-Do and the blocker reason will be cleared.`}
        confirmText="Yes, Unblock"
        cancelText="Keep Blocked"
        variant="success"
        loading={unblocking}
        onConfirm={handleUnblockConfirm}
        onCancel={() => !unblocking && setUnblockConfirm(null)}
      />

      {/* ── Blocker modal (DnD flow) ──────────────────────────── */}
      <BlockReasonModal
        isOpen={!!blockerModal}
        task={blockerModal?.task ?? null}
        onConfirm={handleBlockedConfirm}
        onCancel={handleBlockedCancel}
      />

      {/* ── Blocker modal (Button flow) ────────────────────────── */}
      <BlockReasonModal
        isOpen={!!pendingBlockViaButton}
        task={pendingBlockViaButton?.task ?? null}
        onConfirm={handleButtonBlockConfirm}
        onCancel={() => setPendingBlockViaButton(null)}
      />

      {/* ── Select-task modal ──────────────────────────────────── */}
      <SelectTaskModal
        isOpen={!!selectModal}
        targetStatus={selectModal?.targetStatus}
        sourceTasks={selectModal?.sourceTasks ?? []}
        onSelect={handleSelectTask}
        onCancel={() => setSelectModal(null)}
      />

      {/* ── Create / Edit Task Modal ───────────────────────────── */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        task={editingTask}
        members={members}
        defaultStatus={defaultStatus}
      />

      {/* ── Toast ────────────────────────────────────────────────── */}

      {/* Unblock success toast */}
      {unblockToast && (
        <div
          style={{
            position: 'fixed', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.65rem 1.1rem', borderRadius: 14,
            background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.45)',
            backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            color: '#6ee7b7', fontSize: '0.875rem', fontWeight: 500,
            maxWidth: 460, animation: 'fadeSlideUp 0.22s ease', whiteSpace: 'nowrap',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Task moved back to To-Do
        </div>
      )}
      {/* Workflow toast */}
      {toast && (() => {
        const s = TOAST_LOOK[toast.type] || TOAST_LOOK.error;
        return (
          <div
            style={{
              position: 'fixed', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.65rem 1.1rem', borderRadius: 14,
              background: s.bg, border: `1px solid ${s.border}`,
              backdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500,
              maxWidth: 460, animation: 'fadeSlideUp 0.22s ease', whiteSpace: 'nowrap',
            }}
          >
            {toast.message}
          </div>
        );
      })()}
    </div>
  );
}

