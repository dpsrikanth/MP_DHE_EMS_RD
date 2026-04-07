const db = require('../db');

/**
 * Helper to parse custom time strings like "09.00 am", "12.00 noon", "03.00 pm"
 * Returns minutes from midnight.
 */
const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const s = timeStr.toLowerCase().trim();
    
    // Handle special cases
    if (s.includes('noon')) return 12 * 60;
    if (s.includes('midnight')) return 0;

    // Extract numbers and meridiem
    const match = s.match(/(\d+)\.(\d+)\s*(am|pm|a\.m|p\.m)/i);
    if (!match) return null;

    let [_, hours, minutes, meridiem] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    if (meridiem.includes('p') && hours < 12) hours += 12;
    if (meridiem.includes('a') && hours === 12) hours = 0;

    return hours * 60 + minutes;
};

/**
 * Check if two time intervals overlap
 */
const isOverlapping = (start1, end1, start2, end2) => {
    const s1 = parseTimeToMinutes(start1);
    const e1 = parseTimeToMinutes(end1);
    const s2 = parseTimeToMinutes(start2);
    const e2 = parseTimeToMinutes(end2);

    if (s1 === null || e1 === null || s2 === null || e2 === null) return false;
    return s1 < e2 && s2 < e1;
};


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
 * Seats are assigned to Approved halls sequentially, skipping reserved seats from locked overlapping exams.
 */
exports.autoAllocateSeats = async (req, res) => {
    const client = await db.connect();
    try {
        const { college_id } = req.user || {};
        const { exam_id } = req.body;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });
        if (!exam_id) return res.status(400).json({ error: "Exam ID is required" });

        // 0. Check if this exam is already locked for THIS college
        const lockCheckRes = await client.query(
            `SELECT is_locked FROM exam_seating_locks WHERE exam_id = $1 AND college_id = $2`, 
            [exam_id, college_id]
        );
        if (lockCheckRes.rowCount > 0 && lockCheckRes.rows[0].is_locked) {
            return res.status(400).json({ error: "Seating is locked for your college for this exam and cannot be re-allocated. Unlock first." });
        }

        // Fetch overlap context details
        const currentExamRes = await client.query(`SELECT exam_date, start_time, end_time FROM exams WHERE id = $1`, [exam_id]);
        if (currentExamRes.rowCount === 0) return res.status(404).json({ error: "Exam not found" });
        const currentExam = currentExamRes.rows[0];


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

        // 3. IDENTIFY RESERVED SEATS (Overlapping Locked Exams for THIS college)
        const otherExamsRes = await client.query(
            `SELECT e.id, e.start_time, e.end_time 
             FROM exams e
             JOIN exam_seating_locks esl ON e.id = esl.exam_id
             WHERE esl.college_id = $1 AND e.exam_date = $2 AND esl.is_locked = true AND e.id != $3`,
            [college_id, currentExam.exam_date, exam_id]
        );


        const overlappingExamIds = otherExamsRes.rows
            .filter(e => isOverlapping(currentExam.start_time, currentExam.end_time, e.start_time, e.end_time))
            .map(e => e.id);

        let reservedSeats = new Set();
        if (overlappingExamIds.length > 0) {
            const reservedRes = await client.query(
                `SELECT hall_id, row_no, seat_no FROM seating_arrangements WHERE exam_id = ANY($1)`,
                [overlappingExamIds]
            );
            reservedRes.rows.forEach(r => {
                reservedSeats.add(`${r.hall_id}-${r.row_no}-${r.seat_no}`);
            });
        }

        // 4. Clear existing for this run (Atomic)
        await client.query(`DELETE FROM seating_arrangements WHERE college_id = $1 AND exam_id = $2`, [college_id, exam_id]);

        // 5. Allocation algorithm
        let studentIdx = 0;
        let totalAssigned = 0;
        
        const pattern = req.body?.pattern || 'sequential';

        // Add shuffle capability if random
        if (pattern === 'random') {
            for (let i = students.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [students[i], students[j]] = [students[j], students[i]];
            }
        }

        for (const hall of halls) {
            if (studentIdx >= students.length) break;

            const { id: hall_id, rows, seats_per_row } = hall;
            
            for (let r = 1; r <= rows; r++) {
                if (studentIdx >= students.length) break;
                
                for (let s = 1; s <= seats_per_row; s++) {
                    if (studentIdx >= students.length) break;
                    
                    // SKIP if seat is reserved by overlapping exam
                    if (reservedSeats.has(`${hall_id}-${r}-${s}`)) {
                        continue;
                    }

                    // If alternate pattern skipping logic
                    if (pattern === 'alternate' && (r + s) % 2 !== 0) {
                        continue;
                    }

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
            unassignedCount: students.length - totalAssigned
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("Auto allocation error:", error);
        res.status(500).json({ error: "Failed to allocate seats" });
    } finally {
        if (client) client.release();
    }
};

/**
 * Finalize/Lock seating for an exam
 */
exports.lockSeating = async (req, res) => {
    try {
        const { college_id } = req.user || {};
        const { exam_id, locked } = req.body; 

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });
        if (!exam_id) return res.status(400).json({ error: "Exam ID is required" });

        const isLockedValue = locked === undefined ? true : locked;

        const query = `
            INSERT INTO exam_seating_locks (exam_id, college_id, is_locked, locked_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (exam_id, college_id)
            DO UPDATE SET is_locked = EXCLUDED.is_locked, locked_at = CURRENT_TIMESTAMP
            RETURNING is_locked;
        `;
        const result = await db.query(query, [exam_id, college_id, isLockedValue]);

        res.status(200).json({ 
            message: !isLockedValue ? "Seating unlocked successfully." : "Seating locked and approved successfully.",
            seating_locked: result.rows[0].is_locked 
        });
    } catch (error) {
        console.error("Lock seating error:", error);
        res.status(500).json({ error: "Failed to update lock status" });
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
            SELECT sa.*, s.name as student_name, s.rollnumber, s."programName", h.hall_code, COALESCE(esl.is_locked, false) as seating_locked
            FROM seating_arrangements sa
            JOIN students s ON sa.student_id = s.id
            JOIN examination_halls h ON sa.hall_id = h.id
            LEFT JOIN exam_seating_locks esl ON sa.exam_id = esl.exam_id AND sa.college_id = esl.college_id
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
