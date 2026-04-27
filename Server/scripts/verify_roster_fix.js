const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query(`
            SELECT DISTINCT s.name, s.semister
            FROM students s 
            LEFT JOIN student_internal_marks sim ON s.id = sim.student_id
            WHERE (s."semister" = 'Semester 1' OR sim.subject_id = 1)
        `);
        console.log('---START---');
        console.log('Count:', res.rowCount);
        res.rows.forEach(r => {
            console.log(`${r.name} | ${r.semister}`);
        });
        console.log('---END---');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

