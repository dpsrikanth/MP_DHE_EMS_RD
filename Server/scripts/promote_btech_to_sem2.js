const pool = require('../db.js');
async function run() {
    try {
        console.log('Promoting BTech 2024-2028 students to Semester 2...');
        const res = await pool.query(`
            UPDATE students 
            SET "semister" = 'Semester 2'
            WHERE "programName" = 'BTech' AND batch = '2024-2028'
        `);
        console.log(`Successfully updated ${res.rowCount} students to Semester 2.`);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        pool.end();
    }
}
run();

