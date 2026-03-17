const client = require('./db');

async function seed() {
    try {
        console.log("--- Seeding Exam-level Assignment ---");
        
        // 1. Find the test faculty
        const facultyRes = await client.query("SELECT id FROM users WHERE email = 'ext_verify@test.com'");
        if (facultyRes.rows.length === 0) {
            console.error("Test faculty not found.");
            return;
        }
        const facultyId = facultyRes.rows[0].id;

        // 2. Find an exam with paid registrations
        const examRes = await client.query(`
            SELECT DISTINCT e.id, e.name 
            FROM exams e
            JOIN exam_registrations er ON er.exam_id = e.id
            WHERE er.payment_status = 'Paid'
            LIMIT 1
        `);
        
        if (examRes.rows.length === 0) {
            console.error("No exams with paid registrations found.");
            return;
        }
        const exam = examRes.rows[0];
        console.log(`Found exam: ${exam.name} (ID: ${exam.id})`);

        // 3. Clear old assignments for this faculty to keep it clean
        await client.query("DELETE FROM external_faculty_assignments WHERE faculty_user_id = $1", [facultyId]);

        // 4. Create Exam-level assignment
        await client.query(`
            INSERT INTO external_faculty_assignments (faculty_user_id, exam_id, subject_id, assigned_by)
            VALUES ($1, $2, NULL, (SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = 'University Admin') LIMIT 1))
        `, [facultyId, exam.id]);

        console.log(`Successfully assigned Faculty ${facultyId} to Exam ${exam.id} (${exam.name}) at the EXAM LEVEL.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

seed();
