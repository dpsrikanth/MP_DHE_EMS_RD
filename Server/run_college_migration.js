const fs = require('fs');
const path = require('path');
const client = require('./db');

async function runCollegeNameMigration() {
  try {
    const migrationSql = fs.readFileSync(
      path.join(__dirname, 'migrations/002_add_college_name_to_students.sql'),
      'utf8'
    );

    console.log('Running college name migration...');
    await client.query(migrationSql);
    console.log('✅ College name migration successful!');

  } catch (err) {
    console.error('❌ Error running college name migration:', err);
  } finally {
    process.exit(0);
  }
}

// Give time for the connection to establish from db.js
setTimeout(runCollegeNameMigration, 500);
