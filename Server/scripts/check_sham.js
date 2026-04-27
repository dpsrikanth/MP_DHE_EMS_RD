const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query(`
            SELECT name, "rollnumber", "batch", "semister", "programName" 
            FROM students 
            WHERE name LIKE '%sham%' OR "rollnumber" = '25BT1310'
        `);
        console.log('---START---');
        res.rows.forEach(r => {
            console.log(`${r.name} | ${r.rollnumber} | ${r.batch} | ${r.semister} | ${r.programName}`);
        });
        console.log('---END---');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

