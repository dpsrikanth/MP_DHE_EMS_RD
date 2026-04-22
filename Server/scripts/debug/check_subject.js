const db = require('../../Server/db');
async function check() {
    try {
        const res1 = await db.query("SELECT id FROM subjects WHERE id = 13");
        console.log('SUBJECTS ID 13:', res1.rows);
        const res2 = await db.query("SELECT id FROM master_subjects WHERE id = 13");
        console.log('MASTER SUBJECTS ID 13:', res2.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
