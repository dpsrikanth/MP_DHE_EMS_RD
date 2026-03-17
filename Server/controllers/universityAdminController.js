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
        // Fetch Exams that have paid registrations but NO exam-level external faculty assigned yet
        // A subject-level assignment might still exist, but here we focus on assigning the whole Exam.
        const query = `
            SELECT DISTINCT e.id as exam_id, e.name as exam_name,
                   (SELECT COUNT(DISTINCT er.student_id) FROM exam_registrations er WHERE er.exam_id = e.id AND er.payment_status = 'Paid') as student_count,
                   (SELECT COUNT(DISTINCT m.subject_id) FROM marks m WHERE m.exam_id = e.id) as subject_count
            FROM exams e
            JOIN exam_registrations er ON er.exam_id = e.id
            LEFT JOIN external_faculty_assignments efa ON efa.exam_id = e.id AND efa.subject_id IS NULL
            WHERE efa.id IS NULL AND er.payment_status = 'Paid'
        `;
        const result = await db.query(query);
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

    try {
        await db.query('BEGIN');
        
        if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
            // Subject-level assignments
            for (const subject_id of subject_ids) {
                await db.query(`
                    INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id, assigned_by)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (faculty_user_id, subject_id, exam_id) 
                    DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP
                `, [faculty_user_id, subject_id, exam_id, assigned_by]);
            }
        } else {
            // Exam-level assignment (subject_id IS NULL)
            await db.query(`
                INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id, assigned_by)
                VALUES ($1, NULL, $2, $3)
                ON CONFLICT (faculty_user_id, COALESCE(subject_id, -1), exam_id) 
                DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP
            `, [faculty_user_id, exam_id, assigned_by]);
            // NOTE: The unique constraint might need to handle NULLs correctly. 
            // Better to use a unique index on (faculty_user_id, (COALESCE(subject_id, -1)), exam_id)
        }
        
        await db.query('COMMIT');
        res.status(201).json({ message: "Assignments created successfully" });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Failed to create assignments" });
    }
};

exports.getExternalAssignments = async (req, res) => {
    try {
        const query = `
            SELECT efa.id as assignment_id, efa.status as assignment_status,
                   u.name as faculty_name, e.name as exam_name, 
                   COALESCE(sub.name, 'ALL SUBJECTS') as subject_name,
                   (SELECT COUNT(DISTINCT er.student_id) FROM exam_registrations er WHERE er.exam_id = efa.exam_id AND er.payment_status = 'Paid') as student_count
            FROM external_faculty_assignments efa
            JOIN users u ON efa.faculty_user_id = u.id
            JOIN exams e ON efa.exam_id = e.id
            LEFT JOIN master_subjects sub ON efa.subject_id = sub.id
            ORDER BY efa.assigned_at DESC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
};
exports.getFinalizedExternalMarks = async (req, res) => {
    try {
        const query = `
            SELECT 
                m.id as mark_id, 
                er.student_id,
                er.exam_id,
                COALESCE(m.status, 'Internal Only') as marks_status,
                COALESCE(cim.total_internal, m.internal_marks, 0) as internal_marks, 
                COALESCE(m.external_marks, 0) as external_marks,
                (COALESCE(cim.total_internal, m.internal_marks, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                e.name as exam_name,
                sub.name as subject_name, sub.id as subject_id,
                CASE 
                    WHEN (COALESCE(cim.total_internal, m.internal_marks, 0) + COALESCE(m.external_marks, 0)) >= 40 THEN 'Pass'
                    ELSE 'Fail'
                END as result_status
            FROM exam_registrations er
            JOIN exams e ON er.exam_id = e.id
            JOIN master_subjects sub ON e.subject_id = sub.id
            JOIN students s ON er.student_id = s.id
            LEFT JOIN marks m ON m.student_id = er.student_id AND m.exam_id = er.exam_id AND m.subject_id = e.subject_id
            LEFT JOIN calculated_internal_marks cim ON er.student_id = cim.student_id 
                AND (cim.subject_id = e.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
            WHERE er.payment_status = 'Paid'
              AND (m.status IN ('Pending Approval', 'Approved') OR cim.id IS NOT NULL)
            ORDER BY sub.name ASC, s.rollnumber ASC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getFinalizedExternalMarks error:", error);
        res.status(500).json({ error: "Failed to fetch synchronized marks" });
    }
};
