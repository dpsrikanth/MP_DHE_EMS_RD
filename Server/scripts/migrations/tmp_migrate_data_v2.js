const db = require('../../Server/db');

async function migrate() {
    try {
        // 1. Ensure subject mappings exist for College 4
        const subjects = await db.query(`
            SELECT DISTINCT subject_id, semester_id 
            FROM marks_workflow_status 
            WHERE college_id = 10
        `);
        
        for (const row of subjects.rows) {
            try {
                // Using INSERT ... ON CONFLICT DO NOTHING for safety
                await db.query(`
                    INSERT INTO policy_program_subjects (college_id, program_id, semester_id, subject_id, department_id, policy_id)
                    SELECT 4, program_id, semester_id, subject_id, department_id, policy_id
                    FROM policy_program_subjects
                    WHERE college_id = 10 AND subject_id = $1 AND semester_id = $2
                    LIMIT 1
                    ON CONFLICT DO NOTHING
                `, [row.subject_id, row.semester_id]);
            } catch (e) {
                console.log(`Skipping subject ${row.subject_id} mapping issue: ${e.message}`);
            }
        }

        // 2. Move records (UPDATE)
        const updateRes = await db.query('UPDATE marks_workflow_status SET college_id = 4 WHERE college_id = 10');
        console.log(`Moved ${updateRes.rowCount} workflow records to College 4.`);

        const reviewRes = await db.query('UPDATE student_marks_review SET college_id = 4 WHERE college_id = 10');
        console.log(`Moved ${reviewRes.rowCount} review records to College 4.`);
        
        const calcRes = await db.query('UPDATE calculated_internal_marks SET college_id = 4 WHERE college_id = 10');
        console.log(`Moved ${calcRes.rowCount} calculated marks records to College 4.`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
