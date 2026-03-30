const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function update() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Move programs to university 6 (BARKATULLAH UNIVERSITY)
    const res = await client.query("UPDATE master_programs SET university_id = 6 WHERE id IN (1, 2, 4)");
    console.log('Moved programs to univ 6:', res.rowCount);

  } catch (err) {
    console.error('Update failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

update();
