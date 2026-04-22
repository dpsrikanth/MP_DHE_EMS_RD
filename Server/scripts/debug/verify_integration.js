const pool = require('../../Server/db');

async function verifyHallTicket() {
    try {
        console.log("--- Verifying Hall Ticket Data Integration ---");
        
        // Mocking a student check
        const query = `
            SELECT 
                s.name, sa.seat_no, eh.hall_code
            FROM students s
            LEFT JOIN seating_arrangements sa ON sa.student_id = s.id
            LEFT JOIN examination_halls eh ON sa.hall_id = eh.id
            LIMIT 1
        `;
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            console.log("Sample Data Found:");
            console.log(JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log("No student data found for testing seating joins.");
        }
        
        console.log("\n--- Verifying Secrecy Paper Approval Permissions ---");
        const secrecyRoutes = require('../../Server/routes/secrecyRoutes');
        console.log("Secrecy routes loaded successfully.");

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        pool.end();
    }
}

verifyHallTicket();
