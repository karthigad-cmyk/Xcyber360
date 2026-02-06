import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import providerRoutes from './routes/providers';
import sectionRoutes from './routes/sections';
import questionRoutes from './routes/questions';
import responseRoutes from './routes/responses';
import statsRoutes from './routes/stats';
import userRoutes from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - ALL PRIVATE (except auth endpoints)
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 XCYPER Backend Server                                ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   API Base URL:      http://localhost:${PORT}/api          ║
║   Health Check:      http://localhost:${PORT}/api/health   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
