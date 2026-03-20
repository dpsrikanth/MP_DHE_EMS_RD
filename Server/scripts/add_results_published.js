const pool = require('../db');

async function updateSchema() {
  try {
    console.log("Adding 'results_published' to exams table...");
    await pool.query(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS results_published BOOLEAN DEFAULT false;
    `);
    console.log("Column added successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    process.exit();
  }
}

updateSchema();
