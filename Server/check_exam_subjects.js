const client = require('./db');

async function check() {
    try {
        console.log("--- Distinct Exam Names and count of subjects ---");
        const res = await client.query(`
            SELECT name, COUNT(subject_id) as subject_count, academic_year_id, semester_id
            FROM exams
            GROUP BY name, academic_year_id, semester_id
        `);
        console.table(res.rows);

        console.log("\n--- Checking Marks table for multiple subjects per student per exam ---");
        const marksRes = await client.query(`
            SELECT student_id, exam_id, COUNT(DISTINCT subject_id) as subjects
            FROM marks
            GROUP BY student_id, exam_id
            HAVING COUNT(DISTINCT subject_id) > 1
            LIMIT 5
        `);
        console.table(marksRes.rows);

        if (marksRes.rows.length === 0) {
            console.log("No students found with multiple subjects for the same exam_id in 'marks' table.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
