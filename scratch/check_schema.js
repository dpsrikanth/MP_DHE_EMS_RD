const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function listColumns(tableName) {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    console.log(`\n--- ${tableName} ---`);
    res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error(`Error listing columns for ${tableName}:`, err.message);
  }
}

async function run() {
  await listColumns('students');
  await listColumns('marks');
  await listColumns('exams');
  await listColumns('master_subjects');
  await listColumns('seating_arrangements');
  await listColumns('student_semester_payments');
  await pool.end();
}

run();
