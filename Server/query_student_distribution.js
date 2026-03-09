const client = require('./db.js');

async function run() {
    try {
        const res = await client.query('SELECT "collageName", "programName", "semister", COUNT(*) as student_count FROM students GROUP BY "collageName", "programName", "semister" ORDER BY student_count DESC');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
