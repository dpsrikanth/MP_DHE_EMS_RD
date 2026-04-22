const pool = require('../../db');

async function debug() {
    try {
        const res = await pool.query(`
            SELECT m.id, m.student_id, m.subject_id as marks_sub_id, m.exam_id, e.subject_id as exams_sub_id, e.name as exam_name
            FROM marks m
            JOIN exams e ON m.exam_id = e.id
            WHERE m.subject_id != e.subject_id
        `);
        console.log("Mismatches between marks.subject_id and exams.subject_id:", res.rows);

        const res2 = await pool.query(`
            SELECT * FROM marks WHERE external_marks IS NOT NULL LIMIT 5
        `);
        console.log("Sample marks with external values:", res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
debug();
