const pool = require('../../Server/db');

async function testHallTicketGuard() {
    try {
        console.log("--- Testing Hall Ticket Generation Guard ---");
        
        // We'll mock the logic by checking if there's any student without a seat
        // In the real app, the controller would return 403.
        const query = `
            SELECT 
                s.name, sa.seat_no
            FROM students s
            LEFT JOIN seating_arrangements sa ON sa.student_id = s.id
            LIMIT 5
        `;
        const { rows } = await pool.query(query);
        
        for (const student of rows) {
            console.log(`Student: ${student.name.trim()}`);
            if (!student.seat_no) {
                console.log(">> STATUS: Hall Ticket Blocked (No seat allocated)");
            } else {
                console.log(`>> STATUS: Hall Ticket Allowed (Seat: ${student.seat_no})`);
            }
        }

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        pool.end();
    }
}

testHallTicketGuard();
