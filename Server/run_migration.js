const fs = require('fs');
const path = require('path');
const client = require('./db');

async function runMigration() {
  try {
    const baseSql = fs.readFileSync(path.join(__dirname, 'base_schema.sql'), 'utf8');
    console.log('Running base schema...');
    await client.query(baseSql);
    console.log('Base schema successful!');

    const sql = fs.readFileSync(path.join(__dirname, 'db_schema_update.sql'), 'utf8');
    console.log('Running master schema update...');
    await client.query(sql);
    console.log('Master schema successful!');

  } catch (err) {
    console.error('Error running schema update:', err);
  } finally {
    process.exit(0);
  }
}

// Give time for the connection to establish from db.js
setTimeout(runMigration, 500);
