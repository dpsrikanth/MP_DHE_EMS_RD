const db = require('../db');

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
        const query = `
            SELECT 
                c.id,
                c.name as college_name,
                (
                    SELECT COALESCE(SUM(rows * seats_per_row), 0) 
                    FROM examination_halls 
                    WHERE college_id = c.id AND status = 'Approved'
                ) as approved_capacity,
                (
                    SELECT COUNT(*) 
                    FROM students 
                    WHERE "collageName" ILIKE c.name AND "deleteStatus" = true
                ) as total_students
            FROM colleges c
            ORDER BY c.name ASC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Infrastructure Analytics Error:", err);
        res.status(500).json({ error: "Failed to fetch infrastructure analytics" });
    }
};

// 2. University Admin: Global Exam Stats
exports.getGlobalExamStats = async (req, res) => {
    try {
        const threshold = await getPassThreshold();
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM exams) as total_exams,
                (SELECT COUNT(*) FROM students WHERE "deleteStatus" = true) as total_students,
                (SELECT COUNT(*) FROM marks WHERE total_marks >= $1) as total_passed,
                (SELECT COUNT(*) FROM marks WHERE total_marks < $1) as total_failed
        `;
        const result = await db.query(query, [threshold]);
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
