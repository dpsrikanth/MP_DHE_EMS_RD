const client = require('../../db');

async function check() {
    try {
        console.log("--- Sample from marks table ---");
        const res = await client.query(`
            SELECT m.*, s.name as student_name, sub.name as subject_name
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN master_subjects sub ON m.subject_id = sub.id
            LIMIT 10
        `);
        console.table(res.rows);

        console.log("\n--- Checking for students with multiple marks records (subjects) ---");
        const countRes = await client.query(`
            SELECT student_id, academic_year_id, semester_id, COUNT(subject_id) as subject_count
            FROM marks
            GROUP BY student_id, academic_year_id, semester_id
            HAVING COUNT(subject_id) > 1
            LIMIT 5
        `);
        console.table(countRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
