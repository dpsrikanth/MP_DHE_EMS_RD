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
    
    console.log('--- Checking User ---');
    const userRes = await client.query("SELECT email, university_id FROM users WHERE email = 'admin@example.com'");
    console.log('Admin User:', userRes.rows[0]);

    console.log('--- Checking Programs ---');
    const progRes = await client.query("SELECT university_id, COUNT(*) FROM master_programs GROUP BY university_id");
    console.log('Programs per University:', progRes.rows);

    const progSample = await client.query("SELECT id, name, university_id FROM master_programs LIMIT 5");
    console.log('Sample Programs:', progSample.rows);

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
