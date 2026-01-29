const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP for dev/simplicity, or configure fully
}));

// Debug logger
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  next();
});

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Response compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for test pages)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));
// Explicitly serve uploads to ensure availability
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PinGrid API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
const authRoutes = require('./modules/auth/auth.routes');
const pagesRoutes = require('./modules/pages/pages.routes');
const sectionsRoutes = require('./modules/sections/sections.routes');
const groupsRoutes = require('./modules/groups/groups.routes');
const bookmarksRoutes = require('./modules/bookmarks/bookmarks.routes');
const importRoutes = require('./modules/import/importRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/import', importRoutes);
app.use('/api/upload', require('./modules/upload/upload.routes'));

// Development-only: Migrations endpoint
if (process.env.NODE_ENV === 'development') {
  const migrationsRoutes = require('./shared/routes/migrations');
  app.use('/api/migrations', migrationsRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
