const db = require('./db');
async function checkMarks() {
    const studentId = 20;
    try {
        const res = await db.query('SELECT m.*, sub.name as subject_name FROM marks m JOIN master_subjects sub ON m.subject_id = sub.id WHERE m.student_id = $1', [studentId]);
        console.log('Marks in DB:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkMarks();
