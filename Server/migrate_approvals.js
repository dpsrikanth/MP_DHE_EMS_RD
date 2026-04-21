const db = require('./db');

async function setupDatabase() {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS internal_assessment_approvals (
                id SERIAL PRIMARY KEY,
                college_id INTEGER NOT NULL,
                subject_id INTEGER NOT NULL,
                semester_id INTEGER NOT NULL,
                academic_year_id INTEGER NOT NULL,
                section VARCHAR(50) NOT NULL,
                component_id INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'Draft',
                approved_by INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(college_id, subject_id, semester_id, academic_year_id, section, component_id)
            );
        `;
        await db.query(createTableQuery);
        console.log('Table internal_assessment_approvals created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        process.exit();
    }
}

setupDatabase();
