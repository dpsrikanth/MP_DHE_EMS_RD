const pool = require('../../Server/db');

async function checkSeatingData() {
    try {
        console.log("Checking seating_arrangements sample:");
        const res = await pool.query("SELECT * FROM seating_arrangements LIMIT 5");
        console.table(res.rows);
        
        console.log("\nChecking join in Hall Ticket logic:");
        const userId = 247; // Need a real student user id
        // I'll just check if any student has allocation
        const joinCheck = await pool.query(`
            SELECT s.name, e.name as exam_name, sa.seat_no, sa.exam_id
            FROM students s
            JOIN seating_arrangements sa ON sa.student_id = s.id
            JOIN exams e ON sa.exam_id = e.id
            LIMIT 5
        `);
        console.table(joinCheck.rows);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        pool.end();
    }
}

checkSeatingData();
