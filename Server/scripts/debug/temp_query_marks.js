const db = require('../../db');
async function query() {
    try {
        const res = await db.query("SELECT * FROM marks_workflow_status;");
        console.log(res.rows);
    } catch (e) { console.error(e); }
    process.exit(0);
}
query();
