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
    console.log('--- Checking Colleges and Universities ---');
    
    const uniRes = await client.query("SELECT id, name FROM universities");
    console.log('Universities:', uniRes.rows);

    const collRes = await client.query("SELECT id, name, university_id FROM colleges LIMIT 10");
    console.log('Colleges (first 10):', collRes.rows);

    const adminRes = await client.query("SELECT name, email, university_id FROM users WHERE email = 'admin@example.com'");
    console.log('Admin User:', adminRes.rows[0]);

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
