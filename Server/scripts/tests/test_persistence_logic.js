const client = require('../../db');

async function testPersistence() {
    try {
        console.log("--- Testing External Marks Persistence ---");
        
        // Find the test user ID
        const userRes = await client.query("SELECT id FROM users WHERE email = 'ext_verify@test.com'");
        if (userRes.rows.length === 0) {
            console.error("Test user not found");
            return;
        }
        const userId = userRes.rows[0].id;

        // Find an assignment for this user
        const assignRes = await client.query(`
            SELECT efa.registration_id, er.student_id, er.exam_id, e.subject_id, e.academic_year_id
            FROM external_faculty_assignments efa
            JOIN exam_registrations er ON efa.registration_id = er.id
            JOIN exams e ON er.exam_id = e.id
            WHERE efa.faculty_user_id = $1
            LIMIT 1
        `, [userId]);

        if (assignRes.rows.length === 0) {
            console.error("No assignments found for test user");
            return;
        }

        const data = assignRes.rows[0];
        const lab_marks = 18.5;
        const viva_marks = 7.5;
        const total_external = lab_marks + viva_marks;

        console.log(`Saving marks for Student ${data.student_id}, Subject ${data.subject_id}, Exam ${data.exam_id}`);

        // 1. Save Lab Marks
        await client.query(`
            INSERT INTO student_external_marks_components (student_id, subject_id, exam_id, component_name, marks_obtained, entered_by)
            VALUES ($1, $2, $3, 'Lab Marks', $4, $5)
            ON CONFLICT (student_id, exam_id, subject_id, component_name) 
            DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, updated_at = CURRENT_TIMESTAMP
        `, [data.student_id, data.subject_id, data.exam_id, lab_marks, userId]);

        // 2. Save Viva
        await client.query(`
            INSERT INTO student_external_marks_components (student_id, subject_id, exam_id, component_name, marks_obtained, entered_by)
            VALUES ($1, $2, $3, 'Viva', $4, $5)
            ON CONFLICT (student_id, exam_id, subject_id, component_name) 
            DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, updated_at = CURRENT_TIMESTAMP
        `, [data.student_id, data.subject_id, data.exam_id, viva_marks, userId]);

        // 3. Update main marks table (using similar logic to controller)
        await client.query(`
            INSERT INTO marks (student_id, subject_id, exam_id, academic_year_id, external_marks, total_marks, status)
            VALUES ($1, $2, $3, $4, $5, $5, 'Draft')
            ON CONFLICT (student_id, subject_id, exam_id) 
            DO UPDATE SET 
                external_marks = EXCLUDED.external_marks,
                total_marks = EXCLUDED.external_marks,
                updated_at = CURRENT_TIMESTAMP
        `, [data.student_id, data.subject_id, data.exam_id, data.academic_year_id, total_external]);

        console.log("Marks saved. Verifying...");

        const verifyCompRes = await client.query(`
            SELECT component_name, marks_obtained 
            FROM student_external_marks_components 
            WHERE student_id = $1 AND exam_id = $2 AND subject_id = $3
        `, [data.student_id, data.exam_id, data.subject_id]);
        
        console.log("Components in DB:", verifyCompRes.rows);

        const verifyMarksRes = await client.query(`
            SELECT external_marks, total_marks 
            FROM marks 
            WHERE student_id = $1 AND exam_id = $2 AND subject_id = $3
        `, [data.student_id, data.exam_id, data.subject_id]);
        
        console.log("Aggregate in marks table:", verifyMarksRes.rows);

        if (verifyCompRes.rows.length === 2 && parseFloat(verifyMarksRes.rows[0].external_marks) === total_external) {
            console.log("SUCCESS: Data persistence and aggregate sync verified.");
        } else {
            console.error("FAILURE: Data verification failed.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

testPersistence();
