const db = require('./db');
async function check() {
    try {
        const res = await db.query(`
            SELECT m.grace_marks, m.total_marks, sub.subject_code, sub.name as subject_name
            FROM marks m 
            JOIN master_subjects sub ON m.subject_id = sub.id 
            WHERE m.student_id = (SELECT id FROM students WHERE rollnumber = '25BT1301')
        `);
        console.log('Marks for Alok:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
