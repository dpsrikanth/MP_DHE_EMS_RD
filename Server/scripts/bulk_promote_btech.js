const pool = require('../db.js');
async function run() {
    try {
        console.log('Promoting ALL BTech students in "Semester 1" to "Semester 2"...');
        const res = await pool.query(`
            UPDATE students 
            SET "semister" = 'Semester 2'
            WHERE "programName" = 'BTech' AND "semister" IN ('Semester 1', 'semister1')
        `);
        console.log(`Successfully promoted ${res.rowCount} BTech students to Semester 2.`);
        
        // Also fix the inconsistent batch names while we are at it for the BTech 2024 batch
        const batchFix = await pool.query(`
            UPDATE students
            SET batch = '2024-2028'
            WHERE "programName" = 'BTech' AND (batch IS NULL OR batch IN ('1 year', 'I Year', 'null'))
        `);
        console.log(`Fixed batch labels for ${batchFix.rowCount} BTech students.`);

    } catch (err) {
        console.error('Promotion failed:', err);
    } finally {
        pool.end();
    }
}
run();

