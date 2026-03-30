const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function fix() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to DB.');
    
    // Find correct MP University (ID 7)
    console.log('Update admin@example.com university_id to 7...');
    await client.query("UPDATE users SET university_id = 7 WHERE email = 'admin@example.com'");
    
    console.log('Success.');
  } catch (err) {
    console.error('Fix failed:', err.stack);
  } finally {
    await client.end();
    process.exit(0);
  }
}

fix();
