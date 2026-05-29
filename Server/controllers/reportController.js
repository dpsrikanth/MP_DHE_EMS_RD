const db = require('../config/db');

// --- Helper: Get Pass Threshold ---
const getPassThreshold = async (university_id) => {
    try {
        const query = `SELECT pass_threshold FROM grading_configs WHERE university_id = $1 OR university_id IS NULL ORDER BY university_id DESC LIMIT 1`;
        const res = await db.query(query, [university_id || 1]);
        return res.rows[0]?.pass_threshold || 40; // Default to 40 if not found
    } catch (err) {
        return 40;
    }
};

// 1. University Admin: Infrastructure Capacity vs Student Distribution
exports.getInfrastructureAnalytics = async (req, res) => {
    try {
        const { exam_id } = req.query;
        let query;
        let params = [];

        if (exam_id) {
            query = `
                SELECT 
                    c.id,
                    c.name as college_name,
                    (
                        SELECT COALESCE(SUM(total_capacity), 0) 
                        FROM examination_halls 
                        WHERE college_id = c.id AND status = 'Approved'
                          AND (exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $1)) OR exam_id IS NULL)
                    ) as approved_capacity,
                    (
                        SELECT COALESCE(json_agg(json_build_object('code', hall_code, 'capacity', total_capacity)), '[]'::json)
                        FROM examination_halls
                        WHERE college_id = c.id AND status = 'Approved'
                          AND (exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $1)) OR exam_id IS NULL)
                    ) as approved_halls_details,
                    (
                        SELECT COUNT(DISTINCT er.student_id) 
                        FROM exam_registrations er
                        JOIN students s ON er.student_id = s.id
                        JOIN colleges sc ON s."collageName" ILIKE sc.name 
                        WHERE sc.id = c.id AND s."deleteStatus" = true 
                          AND er.payment_status = 'Paid'
                          AND er.exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $1))
                    ) as total_students
                FROM colleges c
                ORDER BY c.name ASC
            `;
            params = [exam_id];
        } else {
            query = `
                SELECT 
                    c.id,
                    c.name as college_name,
                    (
                        SELECT COALESCE(SUM(total_capacity), 0) 
                        FROM examination_halls 
                        WHERE college_id = c.id AND status = 'Approved'
                    ) as approved_capacity,
                    (
                        SELECT COALESCE(json_agg(json_build_object('code', hall_code, 'capacity', total_capacity)), '[]'::json)
                        FROM examination_halls
                        WHERE college_id = c.id AND status = 'Approved'
                    ) as approved_halls_details,
                    (
                        SELECT COUNT(*) 
                        FROM students 
                        WHERE "collageName" ILIKE c.name AND "deleteStatus" = true
                    ) as total_students
                FROM colleges c
                ORDER BY c.name ASC
            `;
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Infrastructure Analytics Error:", err);
        res.status(500).json({ error: "Failed to fetch infrastructure analytics" });
    }
};

// 2. University Admin: Global Exam Stats
exports.getGlobalExamStats = async (req, res) => {
    try {
        const { exam_id } = req.query;
        const threshold = await getPassThreshold();
        let query;
        let params = [threshold];

        if (exam_id) {
            query = `
                SELECT 
                    1 as total_exams,
                    (SELECT COUNT(*) FROM exam_registrations WHERE exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $2)) AND payment_status = 'Paid') as total_students,
                    (SELECT COUNT(*) FROM marks WHERE exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $2)) AND total_marks >= $1) as total_passed,
                    (SELECT COUNT(*) FROM marks WHERE exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $2)) AND total_marks < $1) as total_failed
            `;
            params.push(exam_id);
        } else {
            query = `
                SELECT 
                    (SELECT COUNT(*) FROM exams) as total_exams,
                    (SELECT COUNT(*) FROM students WHERE "deleteStatus" = true) as total_students,
                    (SELECT COUNT(*) FROM marks WHERE total_marks >= $1) as total_passed,
                    (SELECT COUNT(*) FROM marks WHERE total_marks < $1) as total_failed
            `;
        }

        const result = await db.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Global Exam Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch global exam stats" });
    }
};

// 3. University Admin: Institutional Ranking by Pass %
exports.getInstitutionalRanking = async (req, res) => {
    try {
        const threshold = await getPassThreshold();
        const query = `
            SELECT 
                c.name as college_name,
                COUNT(m.id) as total_marks_entered,
                SUM(CASE WHEN m.total_marks >= $1 THEN 1 ELSE 0 END) as passed_count,
                ROUND((SUM(CASE WHEN m.total_marks >= $1 THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(m.id), 0)) * 100, 2) as pass_percentage
            FROM colleges c
            LEFT JOIN users u ON u.college_id = c.id
            LEFT JOIN students s ON s."collageName" ILIKE c.name
            LEFT JOIN marks m ON m.student_id = s.id
            GROUP BY c.id, c.name
            ORDER BY pass_percentage DESC NULLS LAST
        `;
        const result = await db.query(query, [threshold]);
        res.json(result.rows);
    } catch (err) {
        console.error("Institutional Ranking Error:", err);
        res.status(500).json({ error: "Failed to fetch institutional ranking" });
    }
};

// 4. College Admin: Faculty Grading Progress
exports.getFacultyGradingStatus = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        const { semester_id } = req.query;

        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        let query = `
            SELECT 
                fs.id as allocation_id,
                u.name as faculty_name,
                s.name as subject_name,
                p.name as program_name,
                sem.semester_name,
                fs.section,
                COALESCE(mws.status, 'Not Started') as grading_status,
                mws.updated_at as last_updated
            FROM faculty_subjects fs
            JOIN users u ON fs.teacher_id = u.id
            JOIN master_subjects s ON fs.subject_id = s.id
            JOIN master_semesters sem ON fs.semester_id = sem.id
            JOIN master_programs p ON s.program_id = p.id
            LEFT JOIN marks_workflow_status mws ON 
                fs.college_id = mws.college_id AND 
                fs.subject_id = mws.subject_id AND 
                fs.semester_id = mws.semester_id AND 
                fs.section = mws.section
            WHERE fs.college_id = $1
        `;

        const params = [college_id];
        if (semester_id) {
            query += ` AND fs.semester_id = $2`;
            params.push(semester_id);
        }

        query += ` ORDER BY sem.id, p.name, s.name`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Faculty Status Error:", err);
        res.status(500).json({ error: "Failed to fetch faculty status" });
    }
};

// 6. College Admin: Attendance Shortage Report (students below 75%)
exports.getAttendanceShortage = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        const { semester_id, program_id, threshold = 75 } = req.query;

        const thresh = parseFloat(threshold);

        let query = `
            SELECT
                s.id as student_id,
                COALESCE(s.rollnumber, s.admission_no) as enrollment_no,
                s.name as student_name,
                s."programName" as program_name,
                ms.semester_name,
                msub.name as subject_name,
                msub.subject_code,
                COUNT(a.id) as total_sessions,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as attended_sessions,
                ROUND(
                    (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric /
                    NULLIF(COUNT(a.id), 0)) * 100, 2
                ) as attendance_percentage
            FROM student_attendance a
            JOIN students s ON a.student_id = s.id
            JOIN colleges c ON s."collageName" ILIKE c.name
            LEFT JOIN master_subjects msub ON a.subject_id = msub.id
            LEFT JOIN master_semesters ms ON a.semester_id = ms.id
            WHERE c.id = $1
              AND s."deleteStatus" = true
        `;

        const params = [college_id];
        let idx = 2;

        if (semester_id) {
            query += ` AND a.semester_id = $${idx++}`;
            params.push(semester_id);
        }
        if (program_id) {
            query += ` AND s."programName" ILIKE (SELECT name FROM master_programs WHERE id = $${idx++})`;
            params.push(program_id);
        }

        query += `
            GROUP BY s.id, s.rollnumber, s.admission_no, s.name, s."programName", ms.semester_name, msub.name, msub.subject_code
            HAVING ROUND(
                (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric /
                NULLIF(COUNT(a.id), 0)) * 100, 2
            ) < $${idx}
            ORDER BY attendance_percentage ASC, s.name ASC
        `;
        params.push(thresh);

        const result = await db.query(query, params);
        const rows = result.rows.map(r => ({
            ...r,
            classes_needed: Math.max(0, Math.ceil((thresh * Number(r.total_sessions) - 100 * Number(r.attended_sessions)) / (100 - thresh))),
            status: parseFloat(r.attendance_percentage) < 60 ? 'Critical' : 'Shortage'
        }));
        res.json(rows);
    } catch (err) {
        console.error("Attendance Shortage Error:", err);
        res.status(500).json({ error: "Failed to fetch attendance shortage report" });
    }
};

// 8. HOD: Attendance Shortage scoped to HOD's department
exports.getHODAttendanceShortage = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        const department_id = req.user?.department_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });
        if (!department_id) return res.status(403).json({ error: "No department assigned" });

        const { semester_id, program_id, threshold = 75 } = req.query;
        const thresh = parseFloat(threshold);

        let query = `
            SELECT
                s.id as student_id,
                COALESCE(s.rollnumber, s.admission_no) as enrollment_no,
                s.name as student_name,
                s."programName" as program_name,
                ms.semester_name,
                msub.name as subject_name,
                msub.subject_code,
                COUNT(a.id) as total_sessions,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as attended_sessions,
                ROUND(
                    (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric /
                    NULLIF(COUNT(a.id), 0)) * 100, 2
                ) as attendance_percentage
            FROM student_attendance a
            JOIN students s ON a.student_id = s.id
            JOIN colleges c ON s."collageName" ILIKE c.name
            LEFT JOIN master_subjects msub ON a.subject_id = msub.id
            LEFT JOIN master_semesters ms ON a.semester_id = ms.id
            JOIN policy_program_subjects pps ON pps.subject_id = a.subject_id AND pps.college_id = c.id
            WHERE c.id = $1
              AND pps.department_id = $2
              AND s."deleteStatus" = true
        `;

        const params = [college_id, department_id];
        let idx = 3;

        if (semester_id) {
            query += ` AND a.semester_id = $${idx++}`;
            params.push(semester_id);
        }
        if (program_id) {
            query += ` AND s."programName" ILIKE (SELECT name FROM master_programs WHERE id = $${idx++})`;
            params.push(program_id);
        }

        query += `
            GROUP BY s.id, s.rollnumber, s.admission_no, s.name, s."programName", ms.semester_name, msub.name, msub.subject_code
            HAVING ROUND(
                (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric /
                NULLIF(COUNT(a.id), 0)) * 100, 2
            ) < $${idx}
            ORDER BY attendance_percentage ASC, s.name ASC
        `;
        params.push(thresh);

        const result = await db.query(query, params);
        const rows = result.rows.map(r => ({
            ...r,
            classes_needed: Math.max(0, Math.ceil((thresh * Number(r.total_sessions) - 100 * Number(r.attended_sessions)) / (100 - thresh))),
            status: parseFloat(r.attendance_percentage) < 60 ? 'Critical' : 'Shortage'
        }));
        res.json(rows);
    } catch (err) {
        console.error("HOD Attendance Shortage Error:", err);
        res.status(500).json({ error: "Failed to fetch HOD attendance shortage report" });
    }
};

// 9. Faculty: Attendance Shortage for their assigned subjects
exports.getFacultyAttendanceShortage = async (req, res) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) return res.status(403).json({ error: "Not authenticated" });

        // Resolve teacher_id from master_teachers table (master_teachers.user_id = users.id)
        const teacherRes = await db.query('SELECT id FROM master_teachers WHERE user_id = $1', [user_id]);
        if (teacherRes.rowCount === 0) {
            return res.status(403).json({ error: "Logged in user is not associated with a master teacher record" });
        }
        const teacher_id = teacherRes.rows[0].id;

        const { semester_id, program_id, threshold = 75 } = req.query;
        const thresh = parseFloat(threshold);

        let query = `
            SELECT
                s.id as student_id,
                COALESCE(s.rollnumber, s.admission_no) as enrollment_no,
                s.name as student_name,
                s."programName" as program_name,
                ms.semester_name,
                msub.name as subject_name,
                msub.subject_code,
                fs.section,
                COUNT(a.id) as total_sessions,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as attended_sessions,
                ROUND(
                    (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric /
                    NULLIF(COUNT(a.id), 0)) * 100, 2
                ) as attendance_percentage
            FROM student_attendance a
            JOIN students s ON a.student_id = s.id
            LEFT JOIN master_subjects msub ON a.subject_id = msub.id
            LEFT JOIN master_semesters ms ON a.semester_id = ms.id
            JOIN faculty_subjects fs ON fs.subject_id = a.subject_id
                AND fs.teacher_id = $1
                AND (fs.section IS NULL OR fs.section = a.section)
            WHERE s."deleteStatus" = true
        `;

        const params = [teacher_id];
        let idx = 2;

        if (semester_id) {
            query += ` AND a.semester_id = $${idx++}`;
            params.push(semester_id);
        }
        if (program_id) {
            query += ` AND s."programName" ILIKE (SELECT name FROM master_programs WHERE id = $${idx++})`;
            params.push(program_id);
        }

        query += `
            GROUP BY s.id, s.rollnumber, s.admission_no, s.name, s."programName", ms.semester_name, msub.name, msub.subject_code, fs.section
            HAVING ROUND(
                (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)::numeric /
                NULLIF(COUNT(a.id), 0)) * 100, 2
            ) < $${idx}
            ORDER BY msub.name ASC, attendance_percentage ASC, s.name ASC
        `;
        params.push(thresh);

        const result = await db.query(query, params);
        const rows = result.rows.map(r => ({
            ...r,
            classes_needed: Math.max(0, Math.ceil((thresh * Number(r.total_sessions) - 100 * Number(r.attended_sessions)) / (100 - thresh))),
            status: parseFloat(r.attendance_percentage) < 60 ? 'Critical' : 'Shortage'
        }));
        res.json(rows);
    } catch (err) {
        console.error("Faculty Attendance Shortage Error:", err);
        res.status(500).json({ error: "Failed to fetch faculty attendance shortage report" });
    }
};

// 7. College Admin: Semester-wise Result Summary per Exam
exports.getResultSummary = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        const { exam_id, semester_id, program_id } = req.query;
        if (!exam_id) return res.status(400).json({ error: "exam_id is required" });

        const threshold = await getPassThreshold();

        let query = `
            SELECT
                COALESCE(s.rollnumber, s.admission_no) as enrollment_no,
                s.rollnumber,
                s.name as student_name,
                mp.name as program_name,
                ms.semester_name,
                msub.name as subject_name,
                msub.subject_code,
                (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) as total_marks,
                COALESCE(cim.total_internal, 0) as internal_marks,
                COALESCE(m.external_marks, 0) as external_marks,
                m.grace_marks,
                m.status,
                $2::numeric as pass_threshold,
                CASE
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= $2 THEN 'Pass'
                    ELSE 'Fail'
                END as result_status,
                CASE
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= 90 THEN 'O'
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= 80 THEN 'A+'
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= 70 THEN 'A'
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= 60 THEN 'B+'
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= 50 THEN 'B'
                    WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= $2 THEN 'C'
                    ELSE 'F'
                END as grade
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN colleges c ON s."collageName" ILIKE c.name
            JOIN master_subjects msub ON m.subject_id = msub.id
            JOIN master_programs mp ON msub.program_id = mp.id
            JOIN master_semesters ms ON msub.semester_id = ms.id
            LEFT JOIN calculated_internal_marks cim ON cim.student_id = m.student_id AND cim.subject_id = m.subject_id
            WHERE c.id = $1
              AND m.exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $3))
              AND s."deleteStatus" = true
        `;

        const params = [college_id, threshold, exam_id];
        let idx = 4;

        if (semester_id) {
            query += ` AND msub.semester_id = $${idx++}`;
            params.push(semester_id);
        }
        if (program_id) {
            query += ` AND mp.id = $${idx++}`;
            params.push(program_id);
        }

        query += ` ORDER BY mp.name, ms.semester_name, s.name, msub.name`;

        const result = await db.query(query, params);

        // Also compute summary stats across ALL subjects for this exam series
        const statsQuery = `
            SELECT
                COUNT(DISTINCT m.student_id) as total_students,
                SUM(CASE WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) >= $2 THEN 1 ELSE 0 END) as total_passed,
                SUM(CASE WHEN (COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) < $2 THEN 1 ELSE 0 END) as total_failed,
                ROUND(AVG(COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)), 2) as avg_marks,
                MAX(COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) as highest_marks,
                MIN(COALESCE(m.external_marks, 0) + COALESCE(cim.total_internal, 0)) as lowest_marks
            FROM marks m
            JOIN students s ON m.student_id = s.id
            JOIN colleges c ON s."collageName" ILIKE c.name
            LEFT JOIN calculated_internal_marks cim ON cim.student_id = m.student_id AND cim.subject_id = m.subject_id
            WHERE c.id = $1 
              AND m.exam_id IN (SELECT id FROM exams WHERE name = (SELECT name FROM exams WHERE id = $3)) 
              AND s."deleteStatus" = true
        `;
        const statsResult = await db.query(statsQuery, [college_id, threshold, exam_id]);

        res.json({
            rows: result.rows,
            summary: statsResult.rows[0]
        });
    } catch (err) {
        console.error("Result Summary Error:", err);
        res.status(500).json({ error: "Failed to fetch result summary" });
    }
};

// 5. College Admin: College-wise Subject Performance
exports.getCollegePerformance = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        const threshold = await getPassThreshold();
        const query = `
            SELECT 
                s.name as subject_name,
                p.name as program_name,
                COUNT(m.id) as total_appeared,
                SUM(CASE WHEN m.total_marks >= $1 THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN m.total_marks < $1 THEN 1 ELSE 0 END) as failed
            FROM marks m
            JOIN students st ON m.student_id = st.id
            JOIN colleges c ON st."collageName" ILIKE c.name
            JOIN master_subjects s ON m.subject_id = s.id
            JOIN master_programs p ON s.program_id = p.id
            WHERE c.id = $2
            GROUP BY s.id, s.name, p.name
            ORDER BY p.name, s.name
        `;
        const result = await db.query(query, [threshold, college_id]);
        res.json(result.rows);
    } catch (err) {
        console.error("College Performance Error:", err);
        res.status(500).json({ error: "Failed to fetch college performance" });
    }
};
