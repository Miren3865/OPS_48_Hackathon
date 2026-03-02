import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

/**
 * Initialize and return a singleton socket connection
 * authenticated with the user's JWT token
 */
export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
    withCredentials: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = () => socket;

/**
 * Join a team's real-time room
 */
export const joinTeamRoom = (teamId) => {
  if (socket?.connected) {
    socket.emit('join:team', teamId);
  }
};

/**
 * Leave a team's real-time room
 */
export const leaveTeamRoom = (teamId) => {
  if (socket?.connected) {
    socket.emit('leave:team', teamId);
  }
};

/**
 * Disconnect and tear down the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
