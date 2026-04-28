const db = require('../db');

// --- University Admin APIs (External Faculty Management) ---

exports.getFacultiesForExternal = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email, r.role_name, mt.college_id, c.name as college_name 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN master_teachers mt ON mt.user_id = u.id
            LEFT JOIN colleges c ON mt.college_id = c.id
            WHERE r.role_name = 'External Faculty'
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch external faculties" });
    }
};

exports.getRegistrationsPendingAssignment = async (req, res) => {
    try {
        const { role } = req.user || {};
        const university_id = req.user?.university_id || req.user?.universityId;

        // Fetch Exams that have NO exam-level external faculty assigned yet.
        // We include exams even if they don't have paid student registrations yet.
        let query = `
            SELECT DISTINCT e.id as exam_id, e.name as exam_name,
                   (SELECT COUNT(DISTINCT er.student_id) FROM exam_registrations er WHERE er.exam_id = e.id AND er.payment_status = 'Paid') as student_count,
                   (SELECT COUNT(DISTINCT m.subject_id) FROM marks m WHERE m.exam_id = e.id) as subject_count
            FROM exams e
            LEFT JOIN external_faculty_assignments efa ON efa.exam_id = e.id AND efa.subject_id IS NULL
            WHERE efa.id IS NULL
        `;
        const params = [];

        if (role === 'university_admin') {
            if (!university_id) return res.status(403).json([]);
            query += ` AND e.university_id = $1`;
            params.push(university_id);
        }

        query += ` ORDER BY e.id DESC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch pending exams" });
    }
};

exports.assignExternalFaculty = async (req, res) => {
    const { faculty_user_id, subject_ids, exam_id } = req.body;
    const assigned_by = req.user.id;

    if (!faculty_user_id || !exam_id) {
        return res.status(400).json({ error: "Faculty ID and Exam ID are required" });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
            // Subject-level assignments
            for (const subject_id of subject_ids) {
                await client.query(`
                    INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id, assigned_by)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (faculty_user_id, subject_id, exam_id) 
                    DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP
                `, [faculty_user_id, subject_id, exam_id, assigned_by]);
            }
        } else {
            // Exam-level assignment (subject_id IS NULL)
            await client.query(`
                INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id, assigned_by)
                VALUES ($1, NULL, $2, $3)
                ON CONFLICT (faculty_user_id, COALESCE(subject_id, -1), exam_id) 
                DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP
            `, [faculty_user_id, exam_id, assigned_by]);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: "Assignments created successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Failed to create assignments" });
    } finally {
        client.release();
    }
};

exports.getExternalAssignments = async (req, res) => {
    try {
        const { role } = req.user || {};
        const university_id = req.user?.university_id || req.user?.universityId;

        let query = `
            SELECT efa.id as assignment_id, efa.status as assignment_status,
                   u.name as faculty_name, e.name as exam_name, 
                   COALESCE(sub.name, 'ALL SUBJECTS') as subject_name,
                   (SELECT COUNT(DISTINCT er.student_id) FROM exam_registrations er WHERE er.exam_id = efa.exam_id AND er.payment_status = 'Paid') as student_count
            FROM external_faculty_assignments efa
            JOIN users u ON efa.faculty_user_id = u.id
            JOIN exams e ON efa.exam_id = e.id
            LEFT JOIN master_subjects sub ON efa.subject_id = sub.id
        `;
        const params = [];

        if (role === 'university_admin') {
            if (!university_id) return res.status(403).json([]);
            query += ` WHERE e.university_id = $1`;
            params.push(university_id);
        }

        query += ` ORDER BY efa.assigned_at DESC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
};

exports.getResultHubData = async (req, res) => {
    try {
        const { exam_id, exam_name, college_id, program_id } = req.query;

        const conditions = [];
        const params = [];
        let paramIdx = 1;

        // For External Exams (Type 2), require paid registrations. For Internal (Type 1), be more inclusive.
        conditions.push(`(e.exam_type = 1 OR er.payment_status = 'Paid')`);

        if (exam_id) {
            conditions.push(`e.id = $${paramIdx++}`);
            params.push(exam_id);
        }
        if (exam_name) {
            conditions.push(`e.name = $${paramIdx++}`);
            params.push(exam_name);
        }
        if (college_id) {
            conditions.push(`c.id = $${paramIdx++}`);
            params.push(college_id);
        }
        if (program_id) {
            conditions.push(`e.program_id = $${paramIdx++}`);
            params.push(program_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            WITH raw_internal AS (
                SELECT student_id, subject_id, SUM(marks_obtained::float) as total_raw
                FROM student_internal_marks
                GROUP BY student_id, subject_id
            ),
            marks_base AS (
                SELECT 
                    m.id as mark_id, 
                    s.id as student_id,
                    e.id as exam_id,
                    COALESCE(m.status, 'Not Entered') as marks_status,
                    COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) as internal_marks, 
                    COALESCE(m.external_marks, 0) as external_marks,
                    (COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                    s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s."collageName" as college_name, s."programName" as program_name,
                    e.name as exam_name,
                    e.exam_type,
                    e.results_published,
                    sub.name as subject_name, sub.id as subject_id,
                    sub.credit as credits
                FROM exams e
                JOIN master_programs mp ON e.program_id = mp.id
                JOIN master_semesters ms ON e.semester_id = ms.id
                JOIN students s ON s."programName" = mp.name AND s.semister = ms.semester_name
                JOIN master_subjects sub ON e.subject_id = sub.id
                LEFT JOIN exam_registrations er ON er.student_id = s.id AND er.exam_id = e.id
                -- Join Colleges to get ID and link with Workflow Status
                JOIN colleges c ON s."collageName" ILIKE c.name
                -- CRITICAL: Only show marks that have been officially 'Locked' by the College Admin or Finalized by External
                JOIN marks_workflow_status mws ON mws.college_id = c.id 
                    AND mws.subject_id = sub.id 
                    -- If a student has no section, they match with the finalized workflow of that college/subject
                    AND (mws.section = s.section OR s.section IS NULL OR s.section = '')
                    AND mws.status IN ('Locked', 'Approved', 'Finalized', 'Submitted')
                LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = e.id AND m.subject_id = e.subject_id
                LEFT JOIN calculated_internal_marks cim ON cim.student_id = s.id 
                    AND cim.subject_id = e.subject_id
                LEFT JOIN raw_internal ri ON ri.student_id = s.id AND ri.subject_id = sub.id
                ${whereClause}
            )
            SELECT * FROM marks_base
            ORDER BY subject_name ASC, rollnumber ASC
        `;

        const result = await db.query(query, params);
        const rows = result.rows;

        // Compute summary
        const totalStudents = new Set(rows.map(r => r.student_id)).size;
        const totalSubjects = new Set(rows.map(r => r.subject_name)).size;
        const totalWithMarks = rows.filter(r => r.mark_id !== null);
        const passCount = totalWithMarks.filter(r => Number(r.total_marks) >= 40).length;
        const failCount = totalWithMarks.filter(r => Number(r.total_marks) < 40).length;
        const avgMarks = totalWithMarks.length > 0
            ? (totalWithMarks.reduce((s, r) => s + Number(r.total_marks), 0) / totalWithMarks.length).toFixed(1)
            : '0.0';
        const resultsPublished = rows.length > 0 ? rows[0].results_published : false;
        let examType = rows.length > 0 ? rows[0].exam_type : null;
        
        // Validation for "canPublish" button in UI
        let workflowReady = true;
        if (exam_name) {
            const workflowCheck = await db.query(`
                SELECT COUNT(*) as total, 
                       COUNT(*) FILTER (WHERE status IN ('Locked', 'Finalized')) as locked
                FROM marks_workflow_status mws
                JOIN master_subjects sub ON mws.subject_id = sub.id
                WHERE (mws.college_id = $1 OR $1 IS NULL)
                  AND sub.id IN (
                      SELECT subject_id FROM exams WHERE name = $2
                      UNION
                      SELECT subject_id FROM internal_exam_schedules WHERE round_id = $2
                  )
            `, [college_id || null, exam_name]);
            
            const stats = workflowCheck.rows[0];
            // If we have subjects, all must be locked. If we have NO subjects in workflow table, it's NOT ready.
            if (parseInt(stats.total) === 0 || parseInt(stats.locked) < parseInt(stats.total)) {
                workflowReady = false;
            }
        }
        const canPublish = rows.length > 0 && workflowReady;

        res.status(200).json({
            marks: rows,
            summary: {
                totalStudents,
                totalSubjects,
                passCount,
                failCount,
                avgMarks,
                totalRecords: totalWithMarks.length,
                resultsPublished,
                examType,
                canPublish
            }
        });
    } catch (error) {
        console.error("getResultHubData error:", error);
        res.status(500).json({ error: "Failed to fetch result hub data" });
    }
};

exports.getFinalizedExternalMarks = async (req, res) => {
    try {
        const query = `
            WITH marks_base AS (
                SELECT 
                    m.id as mark_id, 
                    er.student_id,
                    er.exam_id,
                    COALESCE(m.status, 'Internal Only') as marks_status,
                    COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks, 
                    COALESCE(m.external_marks, 0) as external_marks,
                    (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                    s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s."collageName" as college_name, s."programName" as program_name,
                    e.name as exam_name,
                    sub.name as subject_name, sub.id as subject_id,
                    sub.credit as credits
                FROM exam_registrations er
                JOIN exams e ON er.exam_id = e.id
                JOIN master_subjects sub ON e.subject_id = sub.id
                JOIN students s ON er.student_id = s.id
                LEFT JOIN marks m ON m.student_id = er.student_id AND m.exam_id = er.exam_id AND m.subject_id = e.subject_id
                LEFT JOIN calculated_internal_marks cim ON er.student_id = cim.student_id 
                    AND (cim.subject_id = e.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
                LEFT JOIN (
                    SELECT student_id, subject_id, SUM(marks_obtained::float) as total_raw
                    FROM student_internal_marks
                    GROUP BY student_id, subject_id
                ) raw_internal ON er.student_id = raw_internal.student_id AND e.subject_id = raw_internal.subject_id
                WHERE er.payment_status = 'Paid'
                  AND (m.status IN ('Pending Approval', 'Approved', 'Draft', 'Internal Only') OR cim.id IS NOT NULL OR raw_internal.total_raw IS NOT NULL)
            ),
            marks_with_grades AS (
                SELECT *,
                    CASE 
                        WHEN total_marks >= 40 THEN 'Pass'
                        ELSE 'Fail'
                    END as result_status,
                    CASE
                        WHEN total_marks >= 90 THEN 'O'
                        WHEN total_marks >= 80 THEN 'A+'
                        WHEN total_marks >= 70 THEN 'A'
                        WHEN total_marks >= 60 THEN 'B+'
                        WHEN total_marks >= 50 THEN 'B'
                        WHEN total_marks >= 40 THEN 'C'
                        ELSE 'F'
                    END as grade,
                    CASE
                        WHEN total_marks >= 90 THEN 10
                        WHEN total_marks >= 80 THEN 9
                        WHEN total_marks >= 70 THEN 8
                        WHEN total_marks >= 60 THEN 7
                        WHEN total_marks >= 50 THEN 6
                        WHEN total_marks >= 40 THEN 5
                        ELSE 0
                    END as grade_point
                FROM marks_base
            )
            SELECT *,
                (credits * grade_point) as credit_points
            FROM marks_with_grades
            ORDER BY subject_name ASC, rollnumber ASC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getFinalizedExternalMarks error:", error);
        res.status(500).json({ error: "Failed to fetch synchronized marks" });
    }
};
// University Admin: Get all colleges with their current sitting center mapping
exports.getCollegesMapping = async (req, res) => {
    try {
        const { role } = req.user || {};
        const university_id = req.user?.university_id || req.user?.universityId;

        let query = `
            SELECT 
                c1.id, 
                c1.name as college_name, 
                c1.college_code,
                c1.sitting_center_id,
                c2.name as sitting_center_name,
                (
                SELECT COUNT(*) 
                FROM students st 
                JOIN colleges sc ON st."collageName" ILIKE sc.name 
                WHERE sc.sitting_center_id = c1.id AND st."deleteStatus" = true
            ) + (
                SELECT COALESCE(SUM(sr1.shortage), 0) 
                FROM shortage_requests sr1 
                WHERE sr1.allocated_college_id = c1.id AND sr1.status = 'Allocated'
            ) - (
                SELECT COALESCE(SUM(sr2.shortage), 0) 
                FROM shortage_requests sr2 
                WHERE sr2.college_id = c1.id AND sr2.status = 'Allocated'
            ) as student_count,
                (SELECT COALESCE(SUM(h.rows * h.seats_per_row), 0) FROM examination_halls h WHERE h.college_id = c1.id AND h.status = 'Approved') as internal_capacity,
                -- Total students from ALL colleges assigned to THIS college as their center
                (
                    SELECT COUNT(*) 
                    FROM students s 
                    JOIN colleges sc ON s."collageName" ILIKE sc.name 
                    WHERE sc.sitting_center_id = c1.id AND s."deleteStatus" = true
                ) + (
                    SELECT COALESCE(SUM(sr3.shortage), 0) 
                    FROM shortage_requests sr3 
                    WHERE sr3.allocated_college_id = c1.id AND sr3.status = 'Allocated'
                ) - (
                    SELECT COALESCE(SUM(sr4.shortage) , 0)
                    FROM shortage_requests sr4
                    WHERE sr4.college_id = c1.id AND sr4.status = 'Allocated'
                ) as total_assigned_students
            FROM colleges c1
            LEFT JOIN colleges c2 ON c1.sitting_center_id = c2.id
            WHERE 1=1
        `;
        const params = [];

        if (role === 'university_admin') {
            if (!university_id) return res.status(200).json([]);
            query += ` AND c1.university_id = $1`;
            params.push(university_id);
        }

        query += ` ORDER BY c1.name ASC;`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get colleges mapping error:", error);
        res.status(500).json({ error: "Failed to fetch college mappings" });
    }
};

// University Admin: Update sitting center for a college
exports.updateSittingCenter = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { sitting_center_id } = req.body;

        if (sitting_center_id) {
            // --- Step 1: Check center has approved halls ---
            const capacityRes = await db.query(
                `SELECT COALESCE(SUM(rows * seats_per_row), 0) AS total_capacity
                 FROM examination_halls
                 WHERE college_id = $1 AND status = 'Approved'`,
                [sitting_center_id]
            );
            const totalCapacity = parseInt(capacityRes.rows[0].total_capacity);

            if (totalCapacity === 0) {
                return res.status(400).json({
                    error: `Target center has 0 approved seats. Please create and get halls approved for this college first.`
                });
            }

            // --- Step 2: Calculate already-committed seats at this center ---
            // Students from other colleges globally mapped here (sitting_center_id = this center)
            // EXCLUDING the college being re-mapped (collegeId) to avoid double-counting
            const committedRes = await db.query(
                `SELECT 
                    -- Students from colleges permanently mapped to this center
                    COALESCE((
                        SELECT COUNT(*) 
                        FROM students s
                        JOIN colleges gc ON gc.name ILIKE s."collageName"
                        WHERE gc.sitting_center_id = $1
                          AND gc.id != $2
                          AND s."deleteStatus" = true
                    ), 0)
                    +
                    -- Students assigned here via shortage allocation
                    COALESCE((
                        SELECT SUM(sr.shortage) 
                        FROM shortage_requests sr
                        WHERE sr.allocated_college_id = $1 AND sr.status = 'Allocated'
                    ), 0)
                 AS committed_seats`,
                [sitting_center_id, collegeId]
            );
            const committedSeats = parseInt(committedRes.rows[0].committed_seats);
            const availableSeats = totalCapacity - committedSeats;

            // --- Step 3: Get source college's student count ---
            const studentRes = await db.query(
                `SELECT COUNT(*) AS student_count
                 FROM students s
                 JOIN colleges c ON c.name ILIKE s."collageName"
                 WHERE c.id = $1 AND s."deleteStatus" = true`,
                [collegeId]
            );
            const studentCount = parseInt(studentRes.rows[0].student_count);

            // --- Step 4: Hard Block if students don't fit ---
            if (availableSeats <= 0 || studentCount > availableSeats) {
                const centerRes = await db.query(`SELECT name FROM colleges WHERE id = $1`, [sitting_center_id]);
                const centerName = centerRes.rows[0]?.name || 'Target Center';

                const reason = availableSeats <= 0
                    ? `${centerName} is already overcommitted (Total: ${totalCapacity} seats, Already committed: ${committedSeats} students — over capacity by ${Math.abs(availableSeats)}).`
                    : `${centerName} only has ${availableSeats} available seat(s), but ${studentCount} students need to be seated.`;

                return res.status(400).json({
                    error: `Cannot map: ${reason} Please choose a center with more capacity or add more approved halls.`
                });
            }
        }

        // --- All checks passed: do the update ---
        const result = await db.query(
            `UPDATE colleges 
             SET sitting_center_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [sitting_center_id || null, collegeId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "College not found" });
        }

        res.status(200).json({ message: "Sitting center updated successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Update sitting center error:", error);
        res.status(500).json({ error: "Failed to update sitting center" });
    }
};

// University Admin: Get students of a specific college for center allocation
exports.getStudentsForAllocation = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { exam_id } = req.query;
        
        let query = `
            SELECT DISTINCT s.id, s.name, s.rollnumber, s."programName", s.semister, 
                   s.sitting_center_id,
                   c_personal.name as sitting_center_name,
                   -- Actual seated college from seating_arrangements (most accurate)
                   c_seated.name as actual_seated_center_name,
                   -- Bulk college-level mapping (fallback only)
                   hc_center.name as college_center_name,
                   sa.hall_code,
                   sa.row_no,
                   sa.seat_no
            FROM students s
            JOIN colleges hc ON hc.name ILIKE s."collageName"
            JOIN exam_registrations er ON er.student_id = s.id
            LEFT JOIN colleges c_personal ON s.sitting_center_id = c_personal.id
            LEFT JOIN colleges hc_center ON hc.sitting_center_id = hc_center.id
            LEFT JOIN (
                SELECT sa_inner.student_id, sa_inner.exam_id,
                       h.hall_code, sa_inner.row_no, sa_inner.seat_no,
                       sa_inner.college_id as seated_college_id
                FROM seating_arrangements sa_inner
                JOIN examination_halls h ON sa_inner.hall_id = h.id
                ${ exam_id ? 'WHERE sa_inner.exam_id = ' + parseInt(exam_id) : '' }
            ) sa ON sa.student_id = s.id
            LEFT JOIN colleges c_seated ON c_seated.id = sa.seated_college_id
            WHERE hc.id = $1 AND s."deleteStatus" = true AND er.payment_status = 'Paid'
        `;
        const params = [collegeId];

        if (exam_id) {
            query += ` AND er.exam_id = $2`;
            params.push(exam_id);
        }

        query += ` ORDER BY s.rollnumber ASC`;
        
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get students for allocation error:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

// University Admin: Allocate specific students to an external sitting center
exports.allocateStudentsToCenter = async (req, res) => {
    try {
        const { studentIds, targetCenterId } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: "No students selected for allocation" });
        }

        const query = `
            UPDATE students
            SET sitting_center_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ANY($2::int[])
            RETURNING id
        `;
        const result = await db.query(query, [targetCenterId || null, studentIds]);

        res.status(200).json({ 
            message: "Student centers allocated successfully", 
            allocated_count: result.rowCount 
        });
    } catch (error) {
        console.error("Allocate students center error:", error);
        res.status(500).json({ error: "Failed to allocate student centers" });
    }
};
