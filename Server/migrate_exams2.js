const client = require('./db.js');

async function runMigration() {
  try {
    console.log("Adding new columns to exams table...");
    await client.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS department_id INTEGER;`);
    await client.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS program_id INTEGER;`);
    await client.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS academic_year_id INTEGER;`);
    await client.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_id INTEGER;`);
    
    console.log("Seeding exam_types...");
    try {
        await client.query(`ALTER TABLE exam_types ADD CONSTRAINT unique_type_name UNIQUE (type_name);`);
    } catch (e) {}
    await client.query(`INSERT INTO exam_types (type_name) VALUES ('Internal'), ('External') ON CONFLICT DO NOTHING;`);
    
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

setTimeout(runMigration, 1000);
