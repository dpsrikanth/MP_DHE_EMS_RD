const pool = require('./db');

async function checkSchema() {
  const tables = ['faculty_subjects', 'master_subjects'];
  for (const table of tables) {
    try {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [table]);
      console.log(`--- Table: ${table} ---`);
      res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    } catch (err) {
      console.log(`Failed to describe ${table}: ${err.message}`);
    }
  }
  process.exit();
}

checkSchema();
