const client = require('./db.js');

async function updateMarksSchema() {
  try {
    console.log("Updating marks table schema...");
    
    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS internal_marks DECIMAL(5,2);
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS external_marks DECIMAL(5,2);
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS total_marks DECIMAL(5,2);
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Draft';
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES teachers(id);
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS hod_id INTEGER REFERENCES teachers(id);
      ALTER TABLE marks ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES master_academic_years(id);
    `);
    
    console.log("Marks schema updated successfully!");
  } catch (err) {
    console.error("Failed to update marks schema:", err);
  } finally {
    process.exit(0);
  }
}

setTimeout(updateMarksSchema, 1000);
