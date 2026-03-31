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

        // Always require paid registrations
        conditions.push(`er.payment_status = 'Paid'`);

        if (exam_id) {
            conditions.push(`er.exam_id = $${paramIdx++}`);
            params.push(exam_id);
        }
        if (exam_name) {
            conditions.push(`e.name = $${paramIdx++}`);
            params.push(exam_name);
        }
        if (college_id) {
            conditions.push(`e.college_id = $${paramIdx++}`);
            params.push(college_id);
        }
        if (program_id) {
            conditions.push(`e.program_id = $${paramIdx++}`);
            params.push(program_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            WITH marks_base AS (
                SELECT 
                    m.id as mark_id, 
                    er.student_id,
                    er.exam_id,
                    COALESCE(m.status, 'Not Entered') as marks_status,
                    COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks, 
                    COALESCE(m.external_marks, 0) as external_marks,
                    (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                    s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s."collageName" as college_name, s."programName" as program_name,
                    e.name as exam_name,
                    e.results_published,
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

        res.status(200).json({
            marks: rows,
            summary: {
                totalStudents,
                totalSubjects,
                passCount,
                failCount,
                avgMarks,
                totalRecords: totalWithMarks.length,
                resultsPublished
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
