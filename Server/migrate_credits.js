const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function runMigration() {
  try {
    await pool.query("BEGIN");
    
    // Add column
    await pool.query("ALTER TABLE master_subjects ADD COLUMN IF NOT EXISTS credit INTEGER DEFAULT 0;");
    
    // Create the mapping mapping mapping mapping mapping mapping mapping mapping mapping type mapping mapping mapping mapping mapping types
    const query = `
      UPDATE master_subjects 
      SET credit = CASE
        WHEN mapping_type IN ('Major 1', 'Major 2', 'Major', 'Minor', 'Elective') THEN 6
        WHEN mapping_type IN ('Vocational', 'FC-1', 'FC-2', 'FP/Int/Appr', 'AEC', 'SEC', 'VBC') THEN 4
        ELSE 4
      END;
    `;
    await pool.query(query);
    
    await pool.query("COMMIT");
    console.log("Migration successful");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

runMigration();
