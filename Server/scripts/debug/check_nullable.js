const db = require('../../db');
async function check() {
    try {
        const res = await db.query("SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.columns WHERE table_name = 'marks_workflow_status'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
