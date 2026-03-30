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
    
    const userRes = await client.query("SELECT email, role, university_id FROM users WHERE email = 'admin@example.com'");
    console.log('User:', userRes.rows[0]);

    const progRes = await client.query("SELECT university_id, COUNT(*) FROM master_programs GROUP BY university_id");
    console.log('Programs per University:', progRes.rows);

    const uniRes = await client.query("SELECT id, name FROM universities");
    console.log('Universities:', uniRes.rows);

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
