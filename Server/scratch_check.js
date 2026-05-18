const db = require('./config/db');

async function check() {
    try {
        const res1 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'component_acceptance'");
        console.log("component_acceptance:", res1.rows);
        const res2 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'marks_workflow_status'");
        console.log("marks_workflow_status:", res2.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
