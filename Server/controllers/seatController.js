const db = require('../db');

/**
 * Clear all current seat assignments for a College and Exam.
 */
exports.clearAssignments = async (req, res) => {
    try {
        const { college_id } = req.user || {};
        const { exam_id } = req.body;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });
        if (!exam_id) return res.status(400).json({ error: "Exam ID is required" });

        const query = `DELETE FROM seating_arrangements WHERE college_id = $1 AND exam_id = $2`;
        await db.query(query, [college_id, exam_id]);

        res.status(200).json({ message: "All seat assignments cleared successfully." });
    } catch (error) {
        console.error("Clear assignments error:", error);
        res.status(500).json({ error: "Failed to clear assignments" });
    }
};

/**
 * Automatically allocate seats for students with 'Paid' registration status.
 * Students are sorted by Program and then Name.
 * Seats are assigned to Approved halls sequentially.
 */
exports.autoAllocateSeats = async (req, res) => {
    const client = await db.connect();
    try {
        const { college_id } = req.user || {};
        const { exam_id } = req.body;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });
        if (!exam_id) return res.status(400).json({ error: "Exam ID is required" });

        await client.query('BEGIN');

        // 1. Fetch Students (Paid only, sorted by Program and Name)
        const studentQuery = `
            SELECT er.student_id, s.name, s."programName"
            FROM exam_registrations er
            JOIN students s ON er.student_id = s.id
            JOIN colleges c ON s."collageName" ILIKE c.name
            WHERE c.id = $1 
              AND er.exam_id = $2 
              AND er.payment_status = 'Paid'
              AND s."deleteStatus" = true
            ORDER BY s."programName" ASC, s.name ASC
        `;
        const studentRes = await client.query(studentQuery, [college_id, exam_id]);
        const students = studentRes.rows;

        if (students.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "No paid registrations found for this exam." });
        }

        // 2. Fetch Approved Halls
        const hallQuery = `
            SELECT id, hall_code, rows, seats_per_row
            FROM examination_halls
            WHERE college_id = $1 AND status = 'Approved'
            ORDER BY hall_code ASC
        `;
        const hallRes = await client.query(hallQuery, [college_id]);
        const halls = hallRes.rows;

        if (halls.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: "No approved examination halls found." });
        }

        // 3. Clear existing for this run (Atomic)
        await client.query(`DELETE FROM seating_arrangements WHERE college_id = $1 AND exam_id = $2`, [college_id, exam_id]);

        // 4. Allocation algorithm
        let studentIdx = 0;
        let totalAssigned = 0;

        for (const hall of halls) {
            if (studentIdx >= students.length) break;

            const { id: hall_id, rows, seats_per_row } = hall;
            
            for (let r = 1; r <= rows; r++) {
                if (studentIdx >= students.length) break;
                
                for (let s = 1; s <= seats_per_row; s++) {
                    if (studentIdx >= students.length) break;

                    const student = students[studentIdx];
                    
                    await client.query(`
                        INSERT INTO seating_arrangements (college_id, exam_id, student_id, hall_id, row_no, seat_no)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `, [college_id, exam_id, student.student_id, hall_id, r, s]);

                    studentIdx++;
                    totalAssigned++;
                }
            }
        }

        await client.query('COMMIT');
        
        res.status(200).json({ 
            message: `Successfully allocated seats for ${totalAssigned} students.`,
            unassignedCoumt: students.length - totalAssigned
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Auto allocation error:", error);
        res.status(500).json({ error: "Failed to allocate seats" });
    } finally {
        client.release();
    }
};

/**
 * Get the current seating arrangement details for viewing.
 */
exports.getSeatingArrangements = async (req, res) => {
    try {
        const { college_id } = req.user || {};
        const { exam_id } = req.query;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        let query = `
            SELECT sa.*, s.name as student_name, s.rollnumber, s."programName", h.hall_code
            FROM seating_arrangements sa
            JOIN students s ON sa.student_id = s.id
            JOIN examination_halls h ON sa.hall_id = h.id
            WHERE sa.college_id = $1
        `;
        const params = [college_id];

        if (exam_id) {
            query += ` AND sa.exam_id = $2`;
            params.push(exam_id);
        }

        query += ` ORDER BY h.hall_code ASC, sa.row_no ASC, sa.seat_no ASC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get arrangements error:", error);
        res.status(500).json({ error: "Failed to fetch arrangement details" });
    }
};
