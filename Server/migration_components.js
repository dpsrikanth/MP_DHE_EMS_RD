const client = require('./db');

async function run() {
    try {
        console.log("--- Creating student_external_marks_components table ---");
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS student_external_marks_components (
                id SERIAL PRIMARY KEY,
                student_id INTEGER REFERENCES students(id),
                subject_id INTEGER REFERENCES master_subjects(id),
                exam_id INTEGER REFERENCES exams(id),
                component_name VARCHAR(100), -- 'Lab Marks' or 'Viva'
                marks_obtained NUMERIC DEFAULT 0,
                is_absent BOOLEAN DEFAULT false,
                entered_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_student_exam_subject_comp UNIQUE (student_id, exam_id, subject_id, component_name)
            )
        `);

        console.log("--- Ensuring unique constraint on external_faculty_assignments ---");
        await client.query(`
            ALTER TABLE external_faculty_assignments 
            ADD CONSTRAINT unique_registration_assignment_v2 UNIQUE (registration_id)
        `).catch(e => {
            if (e.code === '42710') {
                console.log("Constraint already exists.");
            } else {
                console.warn("Could not add constraint (might already exist or legacy issue):", e.message);
            }
        });

        console.log("Success: Database migration complete.");

    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

run();
