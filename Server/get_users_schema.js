const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '172.16.0.225',
  database: process.env.DB_NAME || 'emsdb',
  password: process.env.DB_PASSWORD || '!ntense@225',
  port: process.env.DB_PORT || 5432,
});

async function checkSchema() {
  try {
    await client.connect();
    
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;
    const res = await client.query(query);
    console.log("Columns in users:");
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    await client.end();
  }
}

checkSchema();
