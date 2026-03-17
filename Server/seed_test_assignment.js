const client = require('./db');

async function seed() {
    try {
        console.log("--- Seeding Test Assignment ---");
        
        // 1. Find a subject with paid registrations
        const regRes = await client.query(`
            SELECT sub.id as subject_id, e.id as exam_id, sub.name as subject_name, e.name as exam_name
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            JOIN master_subjects sub ON e.subject_id = sub.id
            WHERE er.payment_status = 'Paid'
            LIMIT 1
        `);

        if (regRes.rows.length === 0) {
            console.log("No paid registrations found to assign.");
            return;
        }

        const { subject_id, exam_id, subject_name, exam_name } = regRes.rows[0];

        // 2. Find the test faculty user
        const userRes = await client.query("SELECT id FROM users WHERE email = 'ext_verify@test.com'");
        if (userRes.rows.length === 0) {
            console.log("Test faculty user not found.");
            return;
        }
        const faculty_user_id = userRes.rows[0].id;

        // 3. Create assignment
        await client.query(`
            INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (faculty_user_id, subject_id, exam_id) DO NOTHING
        `, [faculty_user_id, subject_id, exam_id]);

        console.log(`Successfully assigned Subject: ${subject_name} (Exam: ${exam_name}) to faculty user ID ${faculty_user_id}.`);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

seed();
