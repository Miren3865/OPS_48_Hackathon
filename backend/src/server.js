require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const initSocket = require('./socket/socketHandler');
const { startEscalationScheduler } = require('./utils/escalationService');

// Route imports
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const riskRoutes = require('./routes/risk');
const standupRoutes = require('./routes/standup');
const chatRoutes = require('./routes/chat');

// Connect to MongoDB
connectDB();

const app = express();
const httpServer = http.createServer(app);

// Accept both local dev and deployed Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'https://ops-48-hackathon.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

// Socket.IO setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// Initialize Socket.IO event handlers
initSocket(io);

// Start deadline escalation cron (runs every 10 min)
startEscalationScheduler(io);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / Postman (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/standup', standupRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 OpsBoard server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
