const pool = require('./db');
async function run() {
  try {
    await pool.query('ALTER TABLE paper_assignments ADD COLUMN IF NOT EXISTS assigned_chief_id INTEGER REFERENCES users(id)');
    console.log("Successfully added assigned_chief_id to paper_assignments.");
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
