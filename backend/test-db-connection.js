/**
 * Test Database Connection
 * Helps diagnose PostgreSQL connection issues
 */

require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Database Connection Test\n');
console.log('Environment Variables:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not Set');
console.log('  Full URL:', process.env.DATABASE_URL);
console.log('');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

// Parse the URL to show details
try {
  const url = new URL(process.env.DATABASE_URL.replace('postgres://', 'postgresql://'));
  console.log('📊 Connection Details:');
  console.log('  Protocol:', url.protocol);
  console.log('  Username:', url.username);
  console.log('  Password:', url.password ? '***' + url.password.slice(-3) : 'NOT SET');
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  Database:', url.pathname.slice(1));
  console.log('');
} catch (error) {
  console.error('❌ Failed to parse DATABASE_URL:', error.message);
}

// Test connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Try without SSL first
});

async function testConnection() {
  console.log('🔌 Attempting to connect...\n');

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!\n');

    // Get PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('📦 PostgreSQL Version:');
    console.log('  ', versionResult.rows[0].version.split('\n')[0]);
    console.log('');

    // List all databases
    const dbResult = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
    );
    console.log('📚 Available Databases:');
    dbResult.rows.forEach(row => {
      console.log('   -', row.datname);
    });
    console.log('');

    // List tables in current database
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('📋 Tables in Current Database:');
    if (tablesResult.rows.length === 0) {
      console.log('   (No tables found - migrations need to be run)');
    } else {
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    }
    console.log('');

    client.release();
    console.log('✅ Connection test completed successfully!');

  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error Details:');
    console.error('  Code:', error.code);
    console.error('  Message:', error.message);
    console.error('');

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('💡 Suggestions:');
      console.error('   - Check that PostgreSQL service is running');
      console.error('   - Verify the hostname in DATABASE_URL');
      console.error('   - Make sure the port (5432) is correct');
    } else if (error.code === '28P01') {
      console.error('💡 Suggestions:');
      console.error('   - Verify the password in DATABASE_URL');
      console.error('   - Check PostgreSQL user permissions');
      console.error('   - Password might contain special characters that need URL encoding');
    } else if (error.code === '3D000') {
      console.error('💡 Suggestions:');
      console.error('   - The database specified in DATABASE_URL does not exist');
      console.error('   - Create the database or use "postgres" as the database name');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
