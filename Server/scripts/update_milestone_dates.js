const pool = require('../db.js');
async function run() {
    console.log('Updating milestones for Semester 2 (Mid-1)...');
    
    // Update MID-1 Exam Round (ID 34)
    // 2025-02-15 to 2025-02-20
    const examStartDate = '2025-02-14T18:30:00.000Z'; // Feb 15 IST
    const examEndDate = '2025-02-19T18:30:00.000Z';   // Feb 20 IST
    
    await pool.query('UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = 34', [examStartDate, examEndDate]);
    console.log('Updated Internal Exam 1 (Mid-1) [ID: 34]');

    // Also update the schedule details milestone (ID 33) deadline to be before the exams
    // User screen shows "Deadline: 05-02-2025" which is already fine for Feb 15 start.
    
    // Update the next milestone "Internal Marks Entry" (ID 35) to start on 21st if needed
    const marksEntryStart = '2025-02-20T18:30:00.000Z'; // Feb 21 IST
    const marksEntryEnd = '2025-02-24T18:30:00.000Z';   // Feb 25 IST
    await pool.query('UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = 35', [marksEntryStart, marksEntryEnd]);
    console.log('Updated Internal Marks Entry (Mid-1) [ID: 35]');

    pool.end();
}
run();

