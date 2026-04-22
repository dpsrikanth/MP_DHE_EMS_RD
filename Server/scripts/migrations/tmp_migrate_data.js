const db = require('../../Server/db');

async function migrate() {
    try {
        // Check if subjects from college 10 are mapped to college 4
        const subjects = await db.query(`
            SELECT DISTINCT subject_id, semester_id, academic_year_id 
            FROM marks_workflow_status 
            WHERE college_id = 10
        `);
        
        console.log('Migrating workflow for subjects:', subjects.rows);

        for (const row of subjects.rows) {
            // Ensure mapping exists for college 4 (copy from 10 if missing)
            const mapCheck = await db.query(`
                SELECT * FROM policy_program_subjects 
                WHERE college_id = 4 AND subject_id = $1 AND semester_id = $2
            `, [row.subject_id, row.semester_id]);
            
            if (mapCheck.rowCount === 0) {
                console.log(`Mapping subject ${row.subject_id} to college 4...`);
                await db.query(`
                    INSERT INTO policy_program_subjects (college_id, program_id, semester_id, subject_id, department_id, policy_id)
                    SELECT 4, program_id, semester_id, subject_id, department_id, policy_id
                    FROM policy_program_subjects
                    WHERE college_id = 10 AND subject_id = $1 AND semester_id = $2
                    LIMIT 1
                `, [row.subject_id, row.semester_id]);
            }
        }

        // Update workflow status
        const updateRes = await db.query('UPDATE marks_workflow_status SET college_id = 4 WHERE college_id = 10');
        console.log(`Moved ${updateRes.rowCount} workflow records to college 4.`);

        // Also move student reviews and calculated marks if they exist
        const reviewRes = await db.query('UPDATE student_marks_review SET college_id = 4 WHERE college_id = 10');
        console.log(`Moved ${reviewRes.rowCount} review records to college 4.`);
        
        const calcRes = await db.query('UPDATE calculated_internal_marks SET college_id = 4 WHERE college_id = 10');
        console.log(`Moved ${calcRes.rowCount} calculated marks records to college 4.`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

migrate();
