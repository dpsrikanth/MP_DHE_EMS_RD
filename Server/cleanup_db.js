const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function cleanup() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    console.log('Moving programs from univ 8 to 7...');
    await client.query("UPDATE master_programs SET university_id = 7 WHERE university_id = 8");

    console.log('Ensuring admin@example.com is univ 7...');
    await client.query("UPDATE users SET university_id = 7 WHERE email = 'admin@example.com'");

    console.log('Deleting university 8...');
    await client.query("DELETE FROM universities WHERE id = 8");

    console.log('Cleanup finished.');

  } catch (err) {
    console.error('Cleanup failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

cleanup();
