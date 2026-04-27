const client = require('../db');

async function check() {
    try {
        console.log("--- Checking External Faculty Assignments ---");
        const assignments = await client.query(`
            SELECT efa.*, u.name as faculty_name, sub.name as subject_name, e.name as exam_name
            FROM external_faculty_assignments efa
            JOIN users u ON efa.faculty_user_id = u.id
            LEFT JOIN master_subjects sub ON efa.subject_id = sub.id
            LEFT JOIN exams e ON efa.exam_id = e.id
        `);
        console.table(assignments.rows);

        console.log("\n--- Checking Paid Registrations for these Exams/Subjects ---");
        // Get unique exam/subject pairs from assignments
        const pairs = assignments.rows.filter(a => a.subject_id && a.exam_id);
        if (pairs.length > 0) {
            for (const pair of pairs) {
                const regs = await client.query(`
                    SELECT COUNT(*) 
                    FROM exam_registrations 
                    WHERE exam_id = $1 AND payment_status = 'Paid'
                `, [pair.exam_id]);
                console.log(`Exam ID ${pair.exam_id} (${pair.exam_name}), Subject ID ${pair.subject_id}: ${regs.rows[0].count} paid registrations.`);
            }
        } else {
            console.log("No subject-level assignments found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();

