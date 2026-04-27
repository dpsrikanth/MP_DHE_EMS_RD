const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query(`
            SELECT name, "rollnumber", "batch", "semister", "programName" 
            FROM students 
            WHERE "semister" = 'Semester 1'
            ORDER BY name
        `);
        console.log('---START---');
        res.rows.forEach(r => {
            console.log(`${r.name} | ${r.rollnumber} | ${r.batch} | ${r.programName}`);
        });
        console.log('---END---');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

