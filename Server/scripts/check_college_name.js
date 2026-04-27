const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query('SELECT DISTINCT "collageName" FROM students WHERE "programName" = \'BTech\'');
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

