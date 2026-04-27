const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query('SELECT name FROM master_subjects WHERE id = 10');
        console.log(res.rows[0]?.name);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

