const db = require('./db');
async function check() {
    try {
        const student = await db.query("SELECT id, rollnumber, name FROM students WHERE rollnumber = '25BT1302'");
        console.log('Student:', student.rows);
        if (student.rows.length > 0) {
            const marks = await db.query(`
                SELECT m.id as mark_id, m.status, m.total_marks, m.grace_marks, sub.subject_code, sub.name as subject_name, e.results_published
                FROM marks m
                JOIN master_subjects sub ON m.subject_id = sub.id
                JOIN exams e ON m.exam_id = e.id
                WHERE m.student_id = $1
            `, [student.rows[0].id]);
            console.log('Marks:', marks.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
