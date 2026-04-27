const pool = require('../db');

async function migrate() {
    try {
        console.log("Starting migration...");
        
        // Add academic_year_id
        await pool.query(`
            ALTER TABLE academic_milestones 
            ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE SET NULL
        `);
        console.log("Added academic_year_id column");

        // Add program_id
        await pool.query(`
            ALTER TABLE academic_milestones 
            ADD COLUMN IF NOT EXISTS program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL
        `);
        console.log("Added program_id column");

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        pool.end();
    }
}

migrate();

