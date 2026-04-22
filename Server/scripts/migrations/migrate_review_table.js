const db = require('../../db');

async function migrate() {
    try {
        console.log("Starting migration: Creating student_marks_review table...");
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS student_marks_review (
                id SERIAL PRIMARY KEY,
                college_id INTEGER NOT NULL,
                subject_id INTEGER NOT NULL,
                semester_id INTEGER NOT NULL,
                academic_year_id INTEGER NOT NULL,
                section VARCHAR(50) NOT NULL,
                student_id INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
                comment TEXT,
                reviewed_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(college_id, subject_id, semester_id, academic_year_id, section, student_id)
            );
        `;
        
        await db.query(createTableQuery);
        console.log("Table student_marks_review created successfully.");
        
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
