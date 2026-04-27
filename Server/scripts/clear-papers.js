const pool = require('../db');

async function run() {
  try {
    await pool.query('DELETE FROM question_papers;');
    await pool.query('DELETE FROM paper_assignments;');
    console.log('Successfully cleared all submitted papers and paper assignment records!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing records:', err);
    process.exit(1);
  }
}

run();

