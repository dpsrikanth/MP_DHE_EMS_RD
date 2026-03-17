const client = require('./db');

async function run() {
    try {
        console.log("--- EXAMS DATA ---");
        const exams = await client.query("SELECT id, name, subject_id, college_id FROM exams LIMIT 20");
        console.table(exams.rows);

        console.log("\n--- EXAM_REGISTRATIONS DATA ---");
        const regs = await client.query("SELECT id, student_id, exam_id, payment_status FROM exam_registrations LIMIT 20");
        console.table(regs.rows);

        console.log("\n--- MASTER_SUBJECTS DATA ---");
        const subs = await client.query("SELECT id, name FROM master_subjects LIMIT 20");
        console.table(subs.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
