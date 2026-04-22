const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '172.16.0.225',
  database: process.env.DB_NAME || 'emsdb',
  password: process.env.DB_PASSWORD || '!ntense@225',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  await client.connect();
  const d = await client.query('SELECT id FROM master_designations LIMIT 1');
  const dep = await client.query('SELECT id FROM master_departments LIMIT 1');
  const c = await client.query('SELECT id FROM colleges LIMIT 1');
  
  console.log("Valid designation_id:", d.rows[0]?.id);
  console.log("Valid department_id:", dep.rows[0]?.id);
  console.log("Valid college_id:", c.rows[0]?.id);
  await client.end();
}
run();
