const pool = require('./db');

async function run() {
  try {
    await pool.query('DELETE FROM question_papers;');
    await pool.query('UPDATE paper_assignments SET file_path = NULL, status = \'Pending\';');
    console.log('Successfully cleared submitted papers!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
