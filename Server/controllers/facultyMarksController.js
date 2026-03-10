const db = require('../db');

// --- Faculty Marks Entry APIs ---

exports.getAssignedSubjects = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        const query = `
            SELECT fs.*, ms.name as subject_name, ms.subject_code, pps.program_id, sem.semester_name 
            FROM faculty_subjects fs
            JOIN master_subjects ms ON fs.subject_id = ms.id
            JOIN master_semesters sem ON fs.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps ON fs.subject_id = pps.subject_id AND fs.college_id = pps.college_id AND fs.semester_id = pps.semester_id
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

        // Fetch string names for matching with students table
        const colRes = await db.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
        const progRes = await db.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
        const semRes = await db.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);

        if (colRes.rowCount === 0 || progRes.rowCount === 0 || semRes.rowCount === 0) {
            return res.status(400).json({ error: "Invalid college, program, or semester ID" });
        }

        const collageName = colRes.rows[0].name;
        const programName = progRes.rows[0].name;
        const semister = semRes.rows[0].semester_name;

        const query = `
            SELECT * FROM students 
            WHERE "collageName" = $1 AND "programName" = $2 AND "semister" = $3
        `;
        const result = await db.query(query, [collageName, programName, semister]);
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

            // Log action using the logged-in user's ID
            if (req.user && req.user.id) {
                await db.query(`INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, 'MARKS_ENTERED_OR_UPDATED', 'MARKS')`, [req.user.id]);
            }

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

exports.submitMarks = async (req, res) => {
    try {
        const { subject_id, section, faculty_id, college_id, semester_id, academic_year_id } = req.body;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const checkQuery = `SELECT id FROM marks_workflow_status WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5`;
            const checkRes = await client.query(checkQuery, [college_id, subject_id, semester_id, academic_year_id, section]);

            if (checkRes.rows.length > 0) {
                await client.query(`UPDATE marks_workflow_status SET status = 'Submitted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [checkRes.rows[0].id]);
            } else {
                await client.query(`
                    INSERT INTO marks_workflow_status 
                    (college_id, subject_id, semester_id, academic_year_id, section, status) 
                    VALUES ($1, $2, $3, $4, $5, 'Submitted')
                `, [college_id, subject_id, semester_id, academic_year_id, section]);
            }

            await client.query('COMMIT');

            if (req.user && req.user.id) {
                await db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'MARKS_SUBMITTED', 'MARKS_WORKFLOW', $2)`, [req.user.id, subject_id]);
            }

            res.status(200).json({ message: "Marks submitted successfully" });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error in submitMarks:", error);
        res.status(500).json({ error: "Failed to submit marks" });
    }
};

