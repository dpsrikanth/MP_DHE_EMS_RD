const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function runMigration() {
  console.log('Starting migration to add sitting_center_id to students table...');
  try {
    const res = await pool.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS sitting_center_id INTEGER REFERENCES colleges(id);
    `);
    console.log('Migration successful: sitting_center_id column added to students.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

runMigration();
