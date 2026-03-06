const db = require('../db');

// --- Faculty Marks Entry APIs ---

exports.getAssignedSubjects = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        // Includes joined subject and semester data
        const query = `
            SELECT fs.*, ms.name as subject_name, ms.subject_code, sem.semester_name 
            FROM faculty_subjects fs
            JOIN master_subjects ms ON fs.subject_id = ms.id
            JOIN master_semesters sem ON fs.semester_id = sem.id
            WHERE fs.teacher_id = $1 AND fs.status = 'Active'
        `;
        const result = await db.query(query, [teacher_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch assigned subjects" });
    }
};

exports.getStudentsForSubject = async (req, res) => {
    try {
        const { college_id, program_id, semester_id } = req.query;
        // Example query, depends slightly on how students are mapped to sections/subjects in reality
        const query = `
            SELECT * FROM students 
            WHERE college_id = $1 AND program_id = $2 AND current_semester_id = $3 AND status = true
        `;
        const result = await db.query(query, [college_id, program_id, semester_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

exports.getEnteredMarks = async (req, res) => {
    try {
        const { subject_id, component_id } = req.query;
        let query = `SELECT * FROM student_internal_marks WHERE subject_id = $1`;
        let params = [subject_id];

        if (component_id) {
            query += ` AND component_id = $2`;
            params.push(component_id);
        }
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch marks" });
    }
}

exports.enterStudentMarks = async (req, res) => {
    try {
        const { marksData, faculty_id } = req.body;
        // marksData = [{ student_id, subject_id, component_id, marks_obtained, is_absent }]

        // Basic validation: Check if marks are locked
        if (marksData.length > 0) {
            const { subject_id } = marksData[0];
            const checkQuery = `SELECT status FROM marks_workflow_status WHERE subject_id = $1 LIMIT 1`;
            const checkRes = await db.query(checkQuery, [subject_id]);
            if (checkRes.rows.length > 0 && ['Approved', 'Locked'].includes(checkRes.rows[0].status)) {
                return res.status(403).json({ error: "Marks entry is locked for this subject." });
            }
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            for (let data of marksData) {
                const query = `
                    INSERT INTO student_internal_marks 
                    (student_id, subject_id, component_id, marks_obtained, is_absent, entered_by_faculty_id) 
                    VALUES ($1, $2, $3, $4, $5, $6) 
                    ON CONFLICT (student_id, component_id) 
                    DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, is_absent = EXCLUDED.is_absent, updated_at = CURRENT_TIMESTAMP
                `;
                await client.query(query, [data.student_id, data.subject_id, data.component_id, data.marks_obtained, data.is_absent, faculty_id]);
            }
            await client.query('COMMIT');

            // Log action if faculty_id is basically user_id
            await db.query(`INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, 'MARKS_ENTERED_OR_UPDATED', 'MARKS')`, [faculty_id]);

            res.status(200).json({ message: "Marks saved successfully" });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save marks" });
    }
};
