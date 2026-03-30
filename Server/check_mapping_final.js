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
    
    console.log('--- Master Programs for Univ 7 ---');
    const mp = await client.query('SELECT id, name FROM master_programs WHERE university_id = 7');
    console.log(mp.rows);

    console.log('--- Mapping Table for Univ 7 (university_master_programs) ---');
    const ump = await client.query('SELECT program_id FROM university_master_programs WHERE university_id = 7');
    console.log(ump.rows.map(r => r.program_id));

  } catch (err) {
    console.error('Check failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

check();
