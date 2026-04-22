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
    
    console.log('Fixing program mappings...');
    await client.query(`
      INSERT INTO university_master_programs (university_id, program_id)
      SELECT university_id, id FROM master_programs
      WHERE university_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    console.log('Fixing academic year mappings...');
    await client.query(`
      INSERT INTO university_master_academic_years (university_id, academic_year_id)
      SELECT university_id, id FROM master_academic_years
      WHERE university_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // Semesters are usually global, but if they had university_id, we'd sync them too.
    // Based on my check, they don't seem to have university_id yet.

    console.log('Fix finished.');

  } catch (err) {
    console.error('Fix failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

fix();
