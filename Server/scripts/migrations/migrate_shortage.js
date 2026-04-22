const pool = require('../../db');

const migrate = async () => {
    try {
        console.log('Starting migration...');
        const query = `
            CREATE TABLE IF NOT EXISTS shortage_requests (
                id SERIAL PRIMARY KEY,
                college_id INTEGER REFERENCES colleges(id),
                program_id INTEGER REFERENCES master_programs(id),
                semester_id INTEGER REFERENCES master_semesters(id),
                student_count INTEGER,
                available_capacity INTEGER,
                shortage INTEGER,
                status VARCHAR(20) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(query);
        console.log('Migration successful: shortage_requests table created.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
