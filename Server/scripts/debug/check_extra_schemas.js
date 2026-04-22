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
    
    const ay = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'master_academic_years'");
    console.log('master_academic_years:', ay.rows.map(r => r.column_name));

    const md = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'master_departments'");
    console.log('master_departments:', md.rows.map(r => r.column_name));

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
