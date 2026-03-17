const client = require('./db');
async function run() {
    try {
        const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_internal_marks' ORDER BY ordinal_position`);
        console.log("--- STUDENT_INTERNAL_MARKS ---");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
