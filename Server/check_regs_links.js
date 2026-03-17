const client = require('./db');

async function check() {
    try {
        console.log("--- Exam Registrations Details ---");
        const regs = await client.query("SELECT * FROM exam_registrations LIMIT 5");
        console.table(regs.rows);

        console.log("\n--- Exams Table Details ---");
        const exams = await client.query("SELECT * FROM exams LIMIT 5");
        console.table(exams.rows);

        console.log("\n--- Checking relationship between Students, Registrations, and Subjects ---");
        // In some systems, exam_registrations is 1:1 with student/exam, 
        // and there's another table for subjects. Or subject_id is in exam_registrations.
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
