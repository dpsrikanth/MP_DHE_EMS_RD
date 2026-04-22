const client = require('../../db');

async function run() {
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS calculated_internal_marks (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id),
                subject_id INTEGER REFERENCES subjects(id),
                best_of_3_score NUMERIC(5,2),
                practical_score NUMERIC(5,2),
                total_internal NUMERIC(5,2),
                passing_status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created calculated_internal_marks table successfully.");
    } catch (e) {
        console.error(e);
    } finally {
        client.end();
    }
}
run();
