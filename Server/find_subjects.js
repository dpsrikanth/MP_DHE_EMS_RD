const client = require('./db');

async function find() {
    try {
        console.log("--- Finding Subjects with Paid Registrations ---");
        const query = `
            SELECT sub.id as subject_id, sub.name as subject_name, e.id as exam_id, e.name as exam_name, COUNT(er.id) as paid_count
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            JOIN master_subjects sub ON e.subject_id = sub.id
            WHERE er.payment_status = 'Paid'
            GROUP BY sub.id, sub.name, e.id, e.name
            LIMIT 5
        `;
        const result = await client.query(query);
        console.table(result.rows);

        console.log("\n--- Checking Test Faculty ID (ext_verify@test.com) ---");
        const user = await client.query("SELECT id, name FROM users WHERE email = 'ext_verify@test.com'");
        console.table(user.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

find();
