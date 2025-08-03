const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./src/config');
const logger = require('./src/config/logger');
const { connectDB } = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorHandler');
const { sanitizeInput, preventXSS } = require('./src/middlewares/validation');

// API 라우트 import
const apiRoutes = require('./src/routes');

const app = express();

// Trust proxy for proper IP detection
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002', 
    'http://127.0.0.1:3003',
    process.env.CORS_ORIGIN || 'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
}));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { 
    stream: { write: (message) => logger.info(message.trim()) },
    skip: (req) => req.url === '/health',
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API specific rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Higher limit for API
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
  },
});

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware for input sanitization
app.use(sanitizeInput);
app.use(preventXSS);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: 'connected',
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'ASI e DAITTA Backend API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1', apiLimiter, apiRoutes);

// Static files (if needed for documentation)
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// 관리자 대시보드 정적 파일 서빙
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// 메인 웹사이트 정적 파일 서빙
app.use('/public', express.static(path.join(__dirname, 'public')));

// 루트 ASI_e_DAITTA.html 서빙
app.get('/ASI_e_DAITTA.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'ASI_e_DAITTA.html'));
});

// API documentation redirect
app.get('/api-docs', (req, res) => {
  res.redirect('/docs/api.html');
});

// Root endpoint - 메인 웹사이트로 리다이렉트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'ASI_e_DAITTA.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

// Global 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Page not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, HOST, () => {
    logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 API: http://${HOST}:${PORT}/api/v1`);
    logger.info(`❤️  Health: http://${HOST}:${PORT}/health`);
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });
}

module.exports = app;