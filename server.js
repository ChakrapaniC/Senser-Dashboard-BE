import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import authRoutes from './src/routes/auth.route.js';
import devicesRoutes from './src/routes/devices.route.js';
import alertsRoutes from './src/routes/alerts.route.js';
import adminRoutes from './src/routes/admin.route.js';
import { setupWebSocket } from './src/services/websocket.service.js';
import { startSimulator } from './src/services/simulator.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/devices', devicesRoutes);
app.use('/api/v1/alerts', alertsRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server
const server = createServer(app);

// Setup WebSocket
setupWebSocket(server);

// Start simulator
startSimulator();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});