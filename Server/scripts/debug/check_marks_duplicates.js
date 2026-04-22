const client = require('../../db');
async function run() {
    try {
        const res = await client.query(`
            SELECT DISTINCT student_id, subject_id, exam_id, COUNT(*) 
            FROM marks 
            GROUP BY student_id, subject_id, exam_id 
            HAVING COUNT(*) > 1
        `);
        console.log("Duplicate student/subject/exam entries in marks table:", res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
