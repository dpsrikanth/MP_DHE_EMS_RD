const db = require('./db');
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS exam_seating_locks (
                exam_id INTEGER REFERENCES exams(id),
                college_id INTEGER REFERENCES colleges(id),
                is_locked BOOLEAN DEFAULT TRUE,
                locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (exam_id, college_id)
            );
        `);
        console.log("Table 'exam_seating_locks' created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
})();
