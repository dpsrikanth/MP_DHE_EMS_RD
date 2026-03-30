const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function check() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('--- Checking Master Departments Data ---');
    
    const res = await client.query("SELECT id, department_name, college_id FROM master_departments LIMIT 20");
    console.log('Master Departments:', res.rows);

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
