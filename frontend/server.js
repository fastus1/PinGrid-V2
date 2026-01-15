/**
 * Production server for PinGrid Frontend
 * Uses Express to serve static files with proper health check
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 PinGrid Frontend running on http://0.0.0.0:${PORT}`);
});
