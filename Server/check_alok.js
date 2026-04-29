const db = require('./db');
async function run() {
    try {
        const res = await db.query(`SELECT m.id, sub.name, m.internal_marks, m.external_marks, m.total_marks, m.grace_marks, m.status 
            FROM marks m 
            JOIN master_subjects sub ON m.subject_id = sub.id 
            JOIN students s ON m.student_id = s.id 
            WHERE s.name ILIKE '%Alok Malewar%'`);
        console.log(res.rows);
    } catch(e) { console.error(e); }
    process.exit(0);
}
run();
