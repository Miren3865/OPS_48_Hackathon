import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { teamsAPI, tasksAPI, riskAPI } from '../services/api';
import { getSocket, joinTeamRoom, leaveTeamRoom } from '../services/socket';

const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const [currentTeam, setCurrentTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [riskReport, setRiskReport] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  // Real-time deadline alerts pushed by the escalation scheduler
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);

  // Load team data and tasks
  const loadTeam = useCallback(async (teamId) => {
    setLoadingTeam(true);
    setLoadingTasks(true);
    try {
      const [teamRes, tasksRes, activityRes] = await Promise.all([
        teamsAPI.getTeam(teamId),
        tasksAPI.getAll(teamId),
        teamsAPI.getActivity(teamId),
      ]);
      setCurrentTeam(teamRes.data);
      setTasks(tasksRes.data);
      setActivityLogs(activityRes.data);
      // Load initial risk report (non-fatal if it fails)
      try {
        const riskRes = await riskAPI.get(teamId);
        setRiskReport(riskRes.data);
      } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoadingTeam(false);
      setLoadingTasks(false);
    }
  }, []);

  // Register Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!currentTeam) return;

    const socket = getSocket();
    if (!socket) return;

    joinTeamRoom(currentTeam._id);

    const onTaskCreated = (task) => {
      setTasks((prev) => {
        // Avoid duplicates
        if (prev.find((t) => t._id === task._id)) return prev;
        return [task, ...prev];
      });
    };

    const onTaskUpdated = (task) => {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    const onTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const onRiskUpdated = (report) => {
      setRiskReport(report);
    };

    const onDeadlineAlert = (alert) => {
      // Append and auto-expire after 30 s so the banner can re-dismiss itself
      setDeadlineAlerts((prev) => [
        ...prev.filter((a) => a.taskId !== alert.taskId),
        { ...alert, receivedAt: Date.now() },
      ]);
      setTimeout(() => {
        setDeadlineAlerts((prev) => prev.filter((a) => a.taskId !== alert.taskId));
      }, 30_000);
    };

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('risk:updated', onRiskUpdated);
    socket.on('deadlineAlert', onDeadlineAlert);

    return () => {
      leaveTeamRoom(currentTeam._id);
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('risk:updated', onRiskUpdated);
      socket.off('deadlineAlert', onDeadlineAlert);
    };
  }, [currentTeam]);

  // ─── Task CRUD helpers ────────────────────────────────────────────────────

  const createTask = async (data) => {
    const { data: task } = await tasksAPI.create(currentTeam._id, data);
    // Socket event will handle state update
    return task;
  };

  const updateTask = async (taskId, data) => {
    const { data: task } = await tasksAPI.update(currentTeam._id, taskId, data);
    return task;
  };

  const deleteTask = async (taskId) => {
    await tasksAPI.delete(currentTeam._id, taskId);
  };

  const unblockTask = async (taskId) => {
    const { data: task } = await tasksAPI.unblock(currentTeam._id, taskId);
    return task;
  };

  const refreshActivity = async () => {
    if (!currentTeam) return;
    const { data } = await teamsAPI.getActivity(currentTeam._id);
    setActivityLogs(data);
  };

  // Computed stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inprogress: tasks.filter((t) => t.status === 'inprogress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    completionRate:
      tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)
        : 0,
  };

  return (
    <TeamContext.Provider
      value={{
        currentTeam,
        setCurrentTeam,
        tasks,
        setTasks,
        activityLogs,
        loadingTeam,
        loadingTasks,
        loadTeam,
        createTask,
        updateTask,
        deleteTask,
        unblockTask,
        refreshActivity,
        stats,
        riskReport,
        setRiskReport,
        deadlineAlerts,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
};
