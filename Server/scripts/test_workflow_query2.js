const pool = require('../db.js');
async function run() {
    try {
        const query = `
            SELECT DISTINCT fs.subject_id, fs.semester_id, s.name as subject_name, sem.semester_name as semester, fs.section
            FROM faculty_subjects fs
            LEFT JOIN master_subjects s ON fs.subject_id = s.id
            LEFT JOIN master_semesters sem ON fs.semester_id = sem.id
            WHERE fs.college_id = $1 AND fs.semester_id = $2
        `;
        const res = await pool.query(query, [10, 16]);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

