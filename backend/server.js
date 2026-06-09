const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');

const { connectDB } = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');
const { initializeSocket } = require('./config/socket');
const { globalErrorHandler, notFoundHandler } = require('./middleware/error');
const { globalLimiter } = require('./middleware/rateLimiter');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

connectDB();
configureCloudinary();
initializeSocket(server);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-Id', 'X-Tenant-Slug'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream: logger.stream }));

app.use(globalLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
    },
  });
});

app.use('/api/v1', apiRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`ISOKOHUB API server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = { app, server };
