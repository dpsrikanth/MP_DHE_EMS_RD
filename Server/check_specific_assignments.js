const client = require('./db');
async function run() {
    try {
        const res = await client.query("SELECT * FROM faculty_subjects WHERE teacher_id IN (5, 14)");
        console.log("Assignments for Teachers 5 and 14:");
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
