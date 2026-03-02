import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

/**
 * useNotifications — requests browser notification permission and
 * shows real-time desktop alerts for key team events:
 *   • A task is blocked
 *   • A task is assigned to you
 *   • A deadline alert fires
 *   • A new task is created (if you are the assignee)
 */
export function useNotifications(currentTeam, currentUserId) {
  const permissionRef = useRef(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Request permission once on mount
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((p) => {
        permissionRef.current = p;
      });
    }
  }, []);

  const notify = (title, body, icon = '/favicon.ico') => {
    if (permissionRef.current !== 'granted') return;
    try {
      const n = new Notification(title, { body, icon, silent: false });
      // Auto-close after 6 s
      setTimeout(() => n.close(), 6000);
    } catch {
      // Ignore — some browsers block notifications from non-secure origins
    }
  };

  useEffect(() => {
    if (!currentTeam) return;
    const socket = getSocket();
    if (!socket) return;

    // ── Task blocked ─────────────────────────────────────────────────────────
    const onTaskUpdated = (task) => {
      if (task.status === 'blocked') {
        const assignedId = (task.assignedTo?._id ?? task.assignedTo)?.toString();
        if (assignedId && assignedId === currentUserId?.toString()) {
          notify(
            '🚧 Your task is blocked',
            `"${task.title}" — ${task.blockerReason || 'No reason given'}`,
          );
        } else {
          notify(
            '🚧 Task Blocked',
            `"${task.title}" has been marked as blocked on ${currentTeam.name}`,
          );
        }
      }
    };

    // ── Task assigned to me ──────────────────────────────────────────────────
    const onTaskCreated = (task) => {
      const assignedId = (task.assignedTo?._id ?? task.assignedTo)?.toString();
      if (assignedId && assignedId === currentUserId?.toString()) {
        notify(
          '📋 New Task Assigned',
          `"${task.title}" has been assigned to you on ${currentTeam.name}`,
        );
      }
    };

    // ── Deadline alert ───────────────────────────────────────────────────────
    const onDeadlineAlert = (alert) => {
      const assignedId = alert.assignedToId?.toString();
      if (assignedId && assignedId === currentUserId?.toString()) {
        const label = alert.isOverdue ? '🔴 Task Overdue' : '⏰ Deadline Approaching';
        const taskTitle = alert.taskTitle || alert.title || 'A task';
        notify(label, `"${taskTitle}" — ${currentTeam.name}`);
      }
    };

    socket.on('task:updated', onTaskUpdated);
    socket.on('task:created', onTaskCreated);
    socket.on('deadlineAlert', onDeadlineAlert);

    return () => {
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:created', onTaskCreated);
      socket.off('deadlineAlert', onDeadlineAlert);
    };
  }, [currentTeam, currentUserId]);
}
