const pool = require('./db');
async function run() {
  try {
    await pool.query('ALTER TABLE paper_assignments ADD COLUMN assigned_chief_id INTEGER;');
    console.log('Successfully added assigned_chief_id column!');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Column already exists!');
      process.exit(0);
    }
    console.error(err);
    process.exit(1);
  }
}
run();
