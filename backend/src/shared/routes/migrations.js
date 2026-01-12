const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const router = express.Router();

// Run a specific migration
router.post('/run/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../migrations', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: `Migration file ${filename} not found`
      });
    }

    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`🔄 Running migration: ${filename}`);

    await pool.query(sql);

    console.log(`✅ Migration ${filename} completed successfully!`);

    res.json({
      success: true,
      message: `Migration ${filename} completed successfully!`
    });
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List available migrations
router.get('/list', (req, res) => {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'));

  res.json({
    success: true,
    migrations: files
  });
});

module.exports = router;
