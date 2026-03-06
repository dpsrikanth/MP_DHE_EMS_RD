const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'ems_db',
  password: process.env.DB_PASSWORD || 'password', // Adjust to user's local pass if needed
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log("Adding columns to exams table...");
    await pool.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES master_departments(id);`);
    await pool.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS program_id INTEGER REFERENCES programs(id);`);
    await pool.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES master_academic_years(id);`);
    await pool.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id);`);
    
    console.log("Seeding exam_types...");
    // Check if table has a unique constraint to avoid conflict errors
    try {
        await pool.query(`ALTER TABLE exam_types ADD CONSTRAINT unique_type_name UNIQUE (type_name);`);
    } catch (e) {
        // Ignore if constraint already exists
    }
    await pool.query(`INSERT INTO exam_types (type_name) VALUES ('Internal'), ('External') ON CONFLICT DO NOTHING;`);
    
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

runMigration();
