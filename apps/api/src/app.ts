import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabases } from './config/database';
import { initializeStorage } from './config/storage';
import passport from './config/passport';
import authRoutes from './routes/auth';
import mediaRoutes from './routes/media';
import memoryRoutes from './routes/memories';
import exportRoutes from './routes/export';
import PerformanceMonitor from './middleware/performance';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring
app.use(PerformanceMonitor.middleware());

// Passport middleware
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/export', exportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Performance metrics endpoint
app.get('/api/performance', (req, res) => {
  const stats = PerformanceMonitor.getStats();
  res.json({
    ...stats,
    message: stats.slowRequestsCount > 0
      ? `⚠️ ${stats.slowRequestsCount} requests exceeded ${stats.targetMs}ms target`
      : `✅ All requests within ${stats.targetMs}ms target`,
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabases();
    await initializeStorage();

    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;