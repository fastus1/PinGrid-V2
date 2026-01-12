const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigration(filename) {
  try {
    console.log(`\n📋 Running migration: ${filename}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const migrationPath = path.join(__dirname, '../migrations', filename);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing SQL...\n');
    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Get filename from command line argument
const filename = process.argv[2] || '001_create_users.sql';
runMigration(filename);
