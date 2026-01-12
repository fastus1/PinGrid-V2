/**
 * Database Migration Script
 * Executes all SQL migrations in order
 *
 * Usage: node run-migrations.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Coolify internal PostgreSQL doesn't use SSL
});

// Migration files directory
const migrationsDir = path.join(__dirname, 'src', 'shared', 'migrations');

// Get all migration files sorted
const getMigrationFiles = () => {
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  return files;
};

// Execute a single migration file
const executeMigration = async (filename) => {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📄 Executing migration: ${filename}`);

  try {
    await pool.query(sql);
    console.log(`✅ Migration ${filename} executed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error executing migration ${filename}:`, error.message);
    return false;
  }
};

// Main migration function
const runMigrations = async () => {
  console.log('🚀 Starting database migrations...\n');

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nPlease check your DATABASE_URL environment variable.');
    process.exit(1);
  }

  // Get migration files
  const migrationFiles = getMigrationFiles();
  console.log(`Found ${migrationFiles.length} migration files:\n`);
  migrationFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  // Execute migrations
  let successCount = 0;
  let failureCount = 0;

  for (const file of migrationFiles) {
    const success = await executeMigration(file);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📁 Total: ${migrationFiles.length}`);
  console.log('='.repeat(50) + '\n');

  if (failureCount > 0) {
    console.log('⚠️  Some migrations failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('🎉 All migrations completed successfully!');
  }

  // Close pool
  await pool.end();
};

// Run migrations
runMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
