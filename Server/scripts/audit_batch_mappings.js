const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query(`
            SELECT bsm.semester_id, bsm.batch_id, b.batch_name 
            FROM batch_semester_mappings bsm 
            JOIN master_batches b ON bsm.batch_id = b.id
            ORDER BY bsm.semester_id
        `);
        console.log('---START---');
        res.rows.forEach(r => {
            console.log(`${r.semester_id} | ${r.batch_id} | ${r.batch_name}`);
        });
        console.log('---END---');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

