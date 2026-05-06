require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '172.16.0.225',
  database: process.env.DB_NAME || 'emsdb',
  password: process.env.DB_PASSWORD || '!ntense@225',
  port: process.env.DB_PORT || 5432,
});

async function findUsers() {
  try {
    const res = await pool.query(`
      SELECT u.email, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name IN ('Admin', 'Faculty', 'HOD', 'College Admin') 
      LIMIT 10;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

findUsers();
