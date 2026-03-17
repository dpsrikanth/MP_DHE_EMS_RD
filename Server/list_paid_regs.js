const client = require('./db');
async function run() {
    try {
        const res = await client.query(`
            SELECT er.id as registration_id, er.student_id, s.first_name, s.last_name, e.name as exam_name
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN exams e ON er.exam_id = e.id
            WHERE er.payment_status = 'Paid'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
