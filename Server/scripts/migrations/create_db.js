const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
});

async function createDb() {
  try {
    await client.connect();
    await client.query('CREATE DATABASE ems_db');
    console.log('Created ems_db');
  } catch (err) {
    console.error('Error creating db:', err);
  } finally {
    process.exit(0);
  }
}

createDb();
