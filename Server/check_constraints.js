const db = require('./db');
async function check() {
    try {
        console.log("--- Constraints for marks_workflow_status ---");
        const res1 = await db.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'marks_workflow_status'::regclass");
        console.log(JSON.stringify(res1.rows, null, 2));

        console.log("\n--- Constraints for audit_logs ---");
        const res2 = await db.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'audit_logs'::regclass");
        console.log(JSON.stringify(res2.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
