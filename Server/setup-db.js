require('dotenv').config({ path: './config/.env' });
const db = require('./config/db');

async function setup() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS student_mark_discrepancies (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id),
                subject_id INTEGER REFERENCES master_subjects(id),
                component_name VARCHAR(100),
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP
            );
        `);
        console.log('Table created successfully');
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

setup();
