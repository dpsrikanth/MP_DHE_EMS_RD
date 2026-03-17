const client = require('./db');

async function run() {
    try {
        console.log("--- Sample Exams ---");
        const exams = await client.query(`
            SELECT id, name, subject_id, college_id 
            FROM exams 
            LIMIT 5
        `);
        console.table(exams.rows);

        console.log("\n--- Sample Registrations with Exam Details ---");
        const regs = await client.query(`
            SELECT er.id, er.student_id, er.exam_id, er.payment_status, e.subject_id
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            LIMIT 10
        `);
        console.table(regs.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
