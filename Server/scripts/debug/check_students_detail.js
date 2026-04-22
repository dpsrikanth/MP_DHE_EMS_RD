const db = require('../../Server/db');
async function check() {
    try {
        const res = await db.query("SELECT first_name, last_name, rollnumber, section FROM students WHERE rollnumber IN ('25BT1301', '25BT1302', '25BT1303')");
        console.log('STUDENT SECTIONS:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
