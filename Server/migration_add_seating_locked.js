const db = require('./db');
(async () => {
    try {
        await db.query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS seating_locked BOOLEAN DEFAULT FALSE;`);
        console.log("Column 'seating_locked' added to 'exams' table successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
})();
