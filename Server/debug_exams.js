const db = require('./db');
async function checkExams() {
    try {
        const res = await db.query(`
            SELECT e.id, e.name, sub.subject_code, sub.name as subject_name, e.results_published, e.exam_type
            FROM exams e 
            JOIN master_subjects sub ON e.subject_id = sub.id 
            WHERE e.name ILIKE '%BTech%'
            ORDER BY e.name, sub.subject_code
        `);
        console.log('Exams:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkExams();
