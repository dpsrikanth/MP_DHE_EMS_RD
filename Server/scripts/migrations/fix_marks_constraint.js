const client = require('../../db');

async function run() {
    try {
        console.log("--- Adding unique constraint to marks table ---");
        
        // Add unique constraint to allow ON CONFLICT (student_id, subject_id, exam_id)
        await client.query(`
            ALTER TABLE marks 
            ADD CONSTRAINT unique_student_subject_exam UNIQUE (student_id, subject_id, exam_id)
        `);

        console.log("Success: Unique constraint added to marks table.");

    } catch (e) {
        if (e.code === '42710') {
            console.log("Constraint already exists.");
        } else {
            console.error("Failed to add constraint:", e);
        }
    } finally {
        process.exit(0);
    }
}

run();
