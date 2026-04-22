const client = require('../../db');

async function runMigration() {
  try {
    await client.connect();
  } catch(e) { }
  
  try {
    const res = await client.query(`
      CREATE TABLE IF NOT EXISTS master_subject_departments (
          subject_id INTEGER REFERENCES master_subjects(id) ON DELETE CASCADE,
          department_id INTEGER REFERENCES master_departments(id) ON DELETE CASCADE,
          PRIMARY KEY (subject_id, department_id)
      );
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
    process.exit(0);
  }
}

runMigration();
