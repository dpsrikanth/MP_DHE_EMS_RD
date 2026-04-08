const db = require('./Server/db');
async function check() {
    try {
        const res = await db.query("SELECT DISTINCT section FROM students");
        console.log('STUDENT SECTIONS:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
