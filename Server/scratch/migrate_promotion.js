const db = require('../config/db');

async function migrate() {
    try {
        console.log("Adding is_promoted column to exams table...");
        await db.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE`);
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        process.exit();
    }
}

migrate();
