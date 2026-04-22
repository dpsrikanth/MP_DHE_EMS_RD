const client = require('../../db');

async function migrate() {
    try {
        console.log("--- Migrating External Faculty Assignments to Subject/Exam Level ---");
        
        // 1. Add subject_id and exam_id columns
        await client.query(`
            ALTER TABLE external_faculty_assignments 
            ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES master_subjects(id),
            ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES exams(id)
        `);
        console.log("Added subject_id and exam_id columns.");

        // 2. Drop unique constraint on registration_id if it exists
        // We'll also drop the registration_id column later once we've migrated data if needed,
        // but for now let's just make it nullable and remove constraints.
        await client.query(`
            ALTER TABLE external_faculty_assignments 
            ALTER COLUMN registration_id DROP NOT NULL
        `);
        
        // Find existing constraint names to drop them
        const constraints = await client.query(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'external_faculty_assignments'::regclass 
            AND (conname LIKE '%unique%' OR conname LIKE '%registration%')
        `);
        for (const row of constraints.rows) {
            await client.query(`ALTER TABLE external_faculty_assignments DROP CONSTRAINT IF EXISTS ${row.conname}`);
            console.log(`Dropped constraint: ${row.conname}`);
        }

        // 3. Add new unique constraint for faculty/subject/exam
        await client.query(`
            ALTER TABLE external_faculty_assignments 
            ADD CONSTRAINT unique_faculty_subject_exam UNIQUE (faculty_user_id, subject_id, exam_id)
        `);
        console.log("Added unique_faculty_subject_exam constraint.");

        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        process.exit(0);
    }
}

migrate();
