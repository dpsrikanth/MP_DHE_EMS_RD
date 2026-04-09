const pool = require('./Server/db');

async function testFinalHallTicket() {
    try {
        console.log("--- Testing Full Hall Ticket Seating Response ---");
        
        const userId = 247; // Anusha Katukojwala has multiple registrations in my check
        const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
        const semesterId = 1;

        // Mocking the behavior of the two queries in getHallTicketData
        
        // 1. Student Info with Seat
        const q1 = `
            SELECT sa.seat_no, eh.hall_code
            FROM students s
            JOIN exam_registrations er ON s.id = er.student_id
            JOIN exams e ON er.exam_id = e.id
            LEFT JOIN seating_arrangements sa ON sa.student_id = s.id AND sa.exam_id = e.id
            LEFT JOIN examination_halls eh ON sa.hall_id = eh.id
            WHERE s.id = 3 -- Hardcoded for Anusha from check result
            LIMIT 1
        `;
        const res1 = await pool.query(q1);
        console.log("Header Seat Info:", res1.rows[0]);

        // 2. Timetable Info with Seat
        const q2 = `
            SELECT 
                e.id, 
                sub.name as subject_name,
                e.exam_date, 
                eh.hall_code,
                sa.seat_no
            FROM exams e
            JOIN master_subjects sub ON e.subject_id = sub.id
            JOIN exam_registrations er ON er.exam_id = e.id AND er.student_id = 3
            LEFT JOIN seating_arrangements sa ON sa.student_id = 3 AND sa.exam_id = e.id
            LEFT JOIN examination_halls eh ON sa.hall_id = eh.id
            WHERE e.name = $1
            ORDER BY e.exam_date ASC
        `;
        const res2 = await pool.query(q2, [examName]);
        console.log("Timetable Seating Info:");
        console.table(res2.rows);

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        pool.end();
    }
}

testFinalHallTicket();
