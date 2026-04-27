const { Client } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
};

async function sync() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    console.log('Cleaning up university_master_programs...');
    // Delete mappings where the program doesn't belong to the university anymore
    // (Excluding NULL university_id programs which are global)
    await client.query(`
      DELETE FROM university_master_programs ump
      WHERE EXISTS (
        SELECT 1 FROM master_programs mp
        WHERE mp.id = ump.program_id 
        AND mp.university_id IS NOT NULL 
        AND mp.university_id != ump.university_id
      )
    `);

    console.log('Sync finished.');

  } catch (err) {
    console.error('Sync failed:', err.message);
  } finally {
    await client.end();
    process.exit(0);
  }
}

sync();

