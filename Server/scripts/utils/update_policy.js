const db = require('./db');
async function update() {
    try {
        const policy = {
            is_enabled: true,
            max_total_grace: 5,
            max_per_subject_grace: 5
        };
        await db.query("UPDATE grading_configs SET grace_policy = $1 WHERE university_id = 7", [JSON.stringify(policy)]);
        console.log('Policy updated successfully to max 5 marks per subject.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
update();
