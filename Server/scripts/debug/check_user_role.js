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
    
    const res = await client.query(`
      SELECT u.email, r.role_name, u.university_id 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.email = 'admin@example.com'
    `);
    console.log('User Mapping:', res.rows[0]);

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
