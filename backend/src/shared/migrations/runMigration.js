require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration(filename) {
  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`🔄 Running migration: ${filename}`);

    await pool.query(sql);

    console.log(`✅ Migration ${filename} completed successfully!`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
    process.exit(1);
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2] || '001_create_users.sql';
runMigration(migrationFile);
