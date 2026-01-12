/**
 * Create Database Script
 * Creates the 'pingrid' database if it doesn't exist
 */

require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  // Parse DATABASE_URL to get connection info
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set!');
    process.exit(1);
  }

  console.log('🔧 Creating Database...\n');

  // Connect to the default 'postgres' database first
  const url = new URL(databaseUrl.replace('postgres://', 'postgresql://'));
  const defaultDbUrl = `postgresql://${url.username}:${url.password}@${url.host}/postgres`;

  console.log('📊 Connection Info:');
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  User:', url.username);
  console.log('  Target Database: pingrid\n');

  const client = new Client({
    connectionString: defaultDbUrl,
    ssl: false
  });

  try {
    // Connect to default postgres database
    await client.connect();
    console.log('✅ Connected to default database\n');

    // Check if pingrid database exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'pingrid'"
    );

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Database "pingrid" already exists!');
    } else {
      // Create the database
      console.log('📝 Creating database "pingrid"...');
      await client.query('CREATE DATABASE pingrid');
      console.log('✅ Database "pingrid" created successfully!');
    }

    console.log('\n✅ Setup complete!');
    console.log('\n💡 Update your DATABASE_URL to:');
    console.log(`   postgresql://${url.username}:${url.password}@${url.host}/pingrid`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
