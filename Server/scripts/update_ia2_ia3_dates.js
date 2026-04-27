const pool = require('../db.js');
async function run() {
    console.log('Updating milestones for Semester 2 (Mid-2 and Mid-3)...');
    
    // Update MID-2 Exam Round (ID 38)
    // 2025-03-18 to 2025-03-23
    const mid2Start = '2025-03-17T18:30:00.000Z'; // Mar 18 IST
    const mid2End = '2025-03-22T18:30:00.000Z';   // Mar 23 IST
    await pool.query('UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = 38', [mid2Start, mid2End]);
    console.log('Updated Internal Exam 2 (Mid-2) [ID: 38]');

    // Update MID-3 Exam Round (IDs 42 and 43 - there seem to be duplicates in the list I saw)
    // 2025-04-17 to 2025-04-22
    const mid3Start = '2025-04-16T18:30:00.000Z'; // Apr 17 IST
    const mid3End = '2025-04-21T18:30:00.000Z';   // Apr 22 IST
    await pool.query('UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id IN (42, 43)', [mid3Start, mid3End]);
    console.log('Updated Internal Exam 3 (Mid-3) [IDs: 42, 43]');

    pool.end();
}
run();

