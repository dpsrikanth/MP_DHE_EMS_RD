const db = require('../../db');

async function migrate() {
  try {
    console.log("Adding university_id to users table...");
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS university_id INTEGER REFERENCES universities(id)
    `);
    
    console.log("Populating university_id for existing users based on their college...");
    await db.query(`
      UPDATE users u
      SET university_id = c.university_id
      FROM colleges c
      WHERE u.college_id = c.id
      AND u.university_id IS NULL
    `);
    
    console.log("Migration completed.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
