import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import db from './db.js';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

// Global rate limit: 500 requests per 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many login attempts, please try again later.' } });

app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Attach db and io to every request
app.use((req, res, next) => {
  req.db = db;
  req.io = io;
  next();
});

// Socket.io — users join their team rooms
io.on('connection', (socket) => {
  socket.on('join_team', (teamId) => {
    socket.join(`team_${teamId}`);
  });
  socket.on('leave_team', (teamId) => {
    socket.leave(`team_${teamId}`);
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
