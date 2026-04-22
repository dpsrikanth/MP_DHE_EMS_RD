const pool = require('../../db');

async function updateSchema() {
  try {
    console.log("Adding columns to exams table...");
    await pool.query(`
      ALTER TABLE exams 
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS student_application_open BOOLEAN DEFAULT false;
    `);
    console.log("Columns added successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    process.exit();
  }
}

updateSchema();
