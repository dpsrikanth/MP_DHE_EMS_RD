const db = require('./db');

async function checkExams() {
    try {
        console.log("--- EXISTING EXAMS FOR SUBJECT 10 ---");
        const res = await db.query(
            "SELECT id, name, exam_type, exam_series_id, college_id FROM exams WHERE subject_id = 10"
        );
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkExams();
