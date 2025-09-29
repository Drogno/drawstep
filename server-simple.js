// ============================================
// DRAWSTEP HYBRID SERVER
// ============================================
// Express server for static files + Mulligan Trainer
// Auth routes proxied to Next.js on port 3001

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// PROXY AUTH ROUTES TO NEXT.JS
// ============================================

// Proxy auth routes to Next.js (port 3002)
app.use('/register', (req, res) => {
  res.redirect('http://localhost:3005/register');
});

app.use('/login', (req, res) => {
  res.redirect('http://localhost:3005/login');
});

app.use('/user', (req, res) => {
  res.redirect('http://localhost:3005/user');
});

// ============================================
// STATIC FILES
// ============================================

// Serve static files from root
app.use(express.static('.', {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }
}));

// ============================================
// MAIN ROUTES
// ============================================

// Root route serves main index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Mulligan Trainer with path fixes
app.get('/mulli', (req, res) => {
  const fs = require('fs');
  const htmlPath = path.join(__dirname, 'tools', 'lorcana-mulligan', 'index.html');

  fs.readFile(htmlPath, 'utf8', (err, html) => {
    if (err) {
      return res.status(500).send('Error loading page');
    }

    // Fix asset paths for Express serving
    const fixedHtml = html
      .replace(/href="assets\//g, 'href="/tools/lorcana-mulligan/assets/')
      .replace(/src="assets\//g, 'src="/tools/lorcana-mulligan/assets/')
      .replace(/href="\.\.\/\.\.\/assets\//g, 'href="/assets/')
      .replace(/src="\.\.\/\.\.\/assets\//g, 'src="/assets/')
      .replace(/src="data\//g, 'src="/tools/lorcana-mulligan/data/')
      .replace(/"data\//g, '"/tools/lorcana-mulligan/data/')
      .replace(/fetch\('data\//g, 'fetch(\'/tools/lorcana-mulligan/data/')
      .replace(/fetch\("data\//g, 'fetch("/tools/lorcana-mulligan/data/')
      .replace(/`assets\/images\/cards\//g, '`/tools/lorcana-mulligan/assets/images/cards/')
      .replace(/'assets\/images\/cards\//g, '\'/tools/lorcana-mulligan/assets/images/cards/')
      .replace(/"assets\/images\/cards\//g, '"/tools/lorcana-mulligan/assets/images/cards/');

    res.send(fixedHtml);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DRAWSTEP Hybrid Server is running',
    ports: {
      static: PORT,
      auth: 3001
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 DRAWSTEP Hybrid Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files: http://localhost:${PORT}`);
  console.log(`🔐 Auth system: http://localhost:3005`);
  console.log(`🎮 Mulligan Trainer: http://localhost:${PORT}/mulli`);
});