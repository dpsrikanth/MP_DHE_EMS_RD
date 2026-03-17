const client = require('./db');

async function check() {
    try {
        console.log("--- Checking exam_registrations and associated exams ---");
        const res = await client.query(`
            SELECT er.student_id, er.exam_id, e.name as exam_name, e.subject_id, sub.name as subject_name
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            JOIN master_subjects sub ON e.subject_id = sub.id
            WHERE er.payment_status = 'Paid'
            LIMIT 20
        `);
        console.table(res.rows);

        console.log("\n--- Checking for students with multiple registrations ---");
        const multiRes = await client.query(`
            SELECT student_id, COUNT(exam_id) as registration_count
            FROM exam_registrations
            WHERE payment_status = 'Paid'
            GROUP BY student_id
            HAVING COUNT(exam_id) > 1
            LIMIT 5
        `);
        console.table(multiRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
