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
    
    console.log('Adding university_id to master_academic_years...');
    await client.query("ALTER TABLE master_academic_years ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id)");
    await client.query("UPDATE master_academic_years SET university_id = 7 WHERE university_id IS NULL");

    console.log('Adding university_id to master_departments...');
    await client.query("ALTER TABLE master_departments ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id)");
    await client.query("UPDATE master_departments SET university_id = 7 WHERE university_id IS NULL");

    console.log('Migration finished.');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrate();
