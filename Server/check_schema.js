const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function getSchema() {
  try {
    await client.connect();
    const tables = ['master_semesters', 'master_teachers', 'master_subjects', 'master_programs'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      console.log(`--- Table: ${table} ---`);
      res.rows.forEach(row => {
        console.log(`${row.column_name}: ${row.data_type}`);
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

getSchema();
