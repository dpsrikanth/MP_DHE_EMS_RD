const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function migrate() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to DB.');
    
    console.log('Adding university_id to master_programs...');
    await client.query("ALTER TABLE master_programs ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id)");
    
    console.log('Assigning existing programs to university 7 (MP UNIVERSITY)...');
    await client.query("UPDATE master_programs SET university_id = 7 WHERE university_id IS NULL");
    
    console.log('Success.');
  } catch (err) {
    console.error('Migration failed:', err.stack);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrate();
