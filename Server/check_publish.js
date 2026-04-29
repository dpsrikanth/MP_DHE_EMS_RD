const db = require('./db');
async function run() {
    const res = await db.query("SELECT name, results_published FROM exams WHERE name = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025' LIMIT 1");
    console.log(res.rows);
    process.exit(0);
}
run();
