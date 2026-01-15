/**
 * Production server for PinGrid Frontend
 * Uses Express to serve static files with proper health check
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint (before static files)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'pingrid-frontend' });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 PinGrid Frontend running on port ${PORT}`);
});
