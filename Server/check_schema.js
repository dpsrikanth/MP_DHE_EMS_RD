const pool = require('./db');

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'exams';
    `);
    console.log("Exams Table Columns:");
    console.table(res.rows);

    const marksRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'internal_marks_structure';
    `);
    console.log("\nInternal Marks Structure Table Columns:");
    console.table(marksRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkSchema();
