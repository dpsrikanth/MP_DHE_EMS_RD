const pool = require('../db.js');
async function run() {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'master_subjects'");
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}
run();

