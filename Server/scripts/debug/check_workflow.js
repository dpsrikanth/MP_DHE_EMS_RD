const db = require('../../Server/db');
async function check() {
    try {
        const res = await db.query("SELECT * FROM marks_workflow_status ORDER BY updated_at DESC LIMIT 10");
        console.log('WORKFLOW STATUS:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
