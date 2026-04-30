const db = require('./db');
async function run() {
    const res = await db.query("SELECT e.id, sub.name, e.results_published FROM exams e JOIN master_subjects sub ON e.subject_id = sub.id WHERE e.name = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025'");
    console.log(res.rows);
    process.exit(0);
}
run();
