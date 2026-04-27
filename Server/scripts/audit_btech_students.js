const pool = require('../db.js');
async function run() {
    try {
        const res = await pool.query(`
            SELECT name, "rollnumber", "batch", "semister" 
            FROM students 
            WHERE "programName" = 'BTech' AND batch = '2024-2028'
            ORDER BY "rollnumber"
        `);
        console.log('---START---');
        res.rows.forEach(r => {
            console.log(`${r.name} | ${r.rollnumber} | ${r.batch} | ${r.semister}`);
        });
        console.log('---END---');
        console.log('Total BTech 2024-2028 Students:', res.rowCount);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
run();

