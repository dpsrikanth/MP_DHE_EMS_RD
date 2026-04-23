require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Adding department column to students table...");
        await client.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(255);');
        console.log("Column added successfully.");
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
