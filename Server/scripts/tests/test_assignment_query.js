const client = require('../../db');

async function run() {
    try {
        console.log("--- Testing getRegistrationsPendingAssignment logic ---");
        const query = `
            SELECT er.id as registration_id, er.student_id, 
                   CONCAT(s.first_name, ' ', s.last_name) as student_name, s.rollnumber, 
                   er.exam_id, e.name as exam_name, sub.name as subject_name, c.name as college_name
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN exams e ON er.exam_id = e.id
            JOIN master_subjects sub ON e.subject_id = sub.id
            LEFT JOIN colleges c ON e.college_id = c.id
            LEFT JOIN external_faculty_assignments efa ON er.id = efa.registration_id
            WHERE efa.id IS NULL AND er.payment_status = 'Paid'
        `;
        const result = await client.query(query);
        console.log("Records found:", result.rows.length);
        if (result.rows.length > 0) {
            console.table(result.rows);
        } else {
            // Let's debug why it might be empty
            console.log("\n--- Debugging Joins ---");
            const regCount = await client.query("SELECT count(*) FROM exam_registrations WHERE payment_status = 'Paid'");
            console.log("Paid Registrations count:", regCount.rows[0].count);

            const joinTest = await client.query(`
                SELECT er.id, er.student_id, s.id as s_id
                FROM exam_registrations er
                LEFT JOIN students s ON er.student_id = s.id
                WHERE er.payment_status = 'Paid'
            `);
            console.log("ER-Student Join Test (sample):");
            console.table(joinTest.rows);

            const examTest = await client.query(`
                SELECT er.id, er.exam_id, e.id as e_id, e.subject_id
                FROM exam_registrations er
                LEFT JOIN exams e ON er.exam_id = e.id
                WHERE er.payment_status = 'Paid'
            `);
            console.log("ER-Exam Join Test (sample):");
            console.table(examTest.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
