// ============================================
// DRAWSTEP BACKEND SERVER
// ============================================
// Simple Node.js/Express backend for user authentication and statistics

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// ============================================
// DATABASE SETUP
// ============================================
const database = require('./database/database');

// Initialize database on startup
database.init().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DRAWSTEP Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// ROUTES SETUP
// ============================================
const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

// Use routes
app.use('/api/auth', authRoutes.router);
app.use('/api/stats', statsRoutes);

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 DRAWSTEP Backend running on port ${PORT}`);
  console.log(`📱 Frontend available at: http://localhost:${PORT}`);
  console.log(`🔧 API available at: http://localhost:${PORT}/api/health`);
});