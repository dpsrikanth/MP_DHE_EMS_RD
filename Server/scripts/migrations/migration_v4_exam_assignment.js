const client = require('../../db');

async function migrate() {
    try {
        console.log("--- Updating External Faculty Assignment Constraints ---");
        
        // Drop existing constraint if it exists
        await client.query("ALTER TABLE external_faculty_assignments DROP CONSTRAINT IF EXISTS unique_faculty_subject_exam");
        await client.query("DROP INDEX IF EXISTS idx_unique_efa_exam_level");

        // Create a unique index that handles NULL subject_id (Exam-level assignment)
        await client.query(`
            CREATE UNIQUE INDEX idx_unique_efa_exam_level 
            ON external_faculty_assignments (faculty_user_id, exam_id, (COALESCE(subject_id, -1)))
        `);

        console.log("Migration successful: Added unique index for Exam-level assignments.");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

migrate();
