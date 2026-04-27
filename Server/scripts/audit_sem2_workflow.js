const pool = require('../db.js');
async function run() {
    try {
        // Get Semester 2 ID
        const semRes = await pool.query("SELECT id, semester_name FROM master_semesters WHERE semester_name ILIKE '%semester 2%' LIMIT 5");
        console.log('Semester 2 records:', semRes.rows);

        // Check if there are any internal marks submitted for Semester 2 subjects
        const batchRes = await pool.query(`
            SELECT mws.subject_id, mws.semester_id, mws.status, ms.semester_name, sub.name as subject_name
            FROM marks_workflow_status mws 
            JOIN master_semesters ms ON mws.semester_id = ms.id
            JOIN master_subjects sub ON mws.subject_id = sub.id
        `);
        console.log('All workflow records:');
        batchRes.rows.forEach(r => {
            console.log(`${r.subject_name} | sem=${r.semester_name} | ${r.status}`);
        });

        // Check student_internal_marks for Semester 2 subject
        const internalRes = await pool.query(`
            SELECT sim.subject_id, sub.name, COUNT(*) as count
            FROM student_internal_marks sim
            JOIN master_subjects sub ON sim.subject_id = sub.id
            GROUP BY sim.subject_id, sub.name
        `);
        console.log('Internal marks by subject:', internalRes.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

