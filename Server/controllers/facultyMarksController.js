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
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.query;
        let query = `SELECT * FROM student_internal_marks WHERE subject_id = $1`;
        let params = [subject_id];

        const marksRes = await db.query(query, params);

        // Fetch individual student review statuses
        const reviewQuery = `
            SELECT student_id, status, comment FROM student_marks_review
            WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5
        `;
        const reviewRes = await db.query(reviewQuery, [subject_id, section, college_id, semester_id, academic_year_id]);
        const reviews = {};
        reviewRes.rows.forEach(r => { reviews[r.student_id] = r; });

        // Also fetch workflow status
        let status = 'Pending';
        const statusQuery = `
            SELECT status FROM marks_workflow_status 
            WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5
        `;
        const statusRes = await db.query(statusQuery, [subject_id, section, college_id, semester_id, academic_year_id]);
        if (statusRes.rows.length > 0) {
            status = statusRes.rows[0].status;
        }

        res.status(200).json({ marks: marksRes.rows, workflowStatus: status, reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch marks" });
    }
}

exports.enterStudentMarks = async (req, res) => {
    try {
        const { marksData, faculty_id, college_id, semester_id, academic_year_id, section } = req.body;
        // marksData = [{ student_id, subject_id, component_id, marks_obtained, is_absent }]

        // Basic validation: Check if marks are locked
        if (marksData.length > 0) {
            const { subject_id } = marksData[0];

            // Look up the workflow status for this specific section/college/semester
            const checkQuery = `
                SELECT status FROM marks_workflow_status 
                WHERE subject_id = $1 AND college_id = $2 
                AND semester_id = $3 AND academic_year_id = $4 AND section = $5
            `;
            const checkRes = await db.query(checkQuery, [subject_id, college_id, semester_id, academic_year_id, section]);
            const globalStatus = checkRes.rows.length > 0 ? checkRes.rows[0].status : 'Pending';

            if (['Approved', 'Locked', 'Submitted', 'Rejected'].includes(globalStatus)) {
                // Check if EACH student in the batch is allowed to be edited
                for (let data of marksData) {
                    const studentReviewQuery = `
                        SELECT status FROM student_marks_review 
                        WHERE subject_id = $1 AND student_id = $2 AND college_id = $3 
                        AND semester_id = $4 AND academic_year_id = $5 AND section = $6
                    `;
                    const studentReviewRes = await db.query(studentReviewQuery,
                        [subject_id, data.student_id, college_id, semester_id, academic_year_id, section]);
                    const studentStatus = studentReviewRes.rows.length > 0 ? studentReviewRes.rows[0].status : 'Pending';

                    if (studentStatus !== 'Rejected') {
                        // Leniency check: If not rejected, only error if we are actually CHANGING existing data
                        const existingRes = await db.query(
                            `SELECT marks_obtained, is_absent FROM student_internal_marks 
                             WHERE student_id = $1 AND subject_id = $2 AND component_id = $3`,
                            [data.student_id, subject_id, data.component_id]
                        );

                        if (existingRes.rows.length > 0) {
                            const existing = existingRes.rows[0];
                            const isMarksSame = parseFloat(existing.marks_obtained) === parseFloat(data.marks_obtained);
                            const isAbsentSame = existing.is_absent === data.is_absent;

                            if (isMarksSame && isAbsentSame) {
                                continue; // No change for this locked student, proceed to next
                            }
                        }

                        return res.status(403).json({ error: `Marks entry is locked for student ID ${data.student_id}. Only rejected students can be modified.` });
                    }
                }
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
                    DO UPDATE SET 
                        updated_at = CASE 
                            WHEN student_internal_marks.marks_obtained != EXCLUDED.marks_obtained 
                                 OR student_internal_marks.is_absent != EXCLUDED.is_absent 
                            THEN CURRENT_TIMESTAMP 
                            ELSE student_internal_marks.updated_at 
                        END,
                        marks_obtained = EXCLUDED.marks_obtained, 
                        is_absent = EXCLUDED.is_absent
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

            const checkQuery = `SELECT id, status, updated_at FROM marks_workflow_status WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5`;
            const checkRes = await client.query(checkQuery, [college_id, subject_id, semester_id, academic_year_id, section]);

            if (checkRes.rows.length > 0) {
                const workflow = checkRes.rows[0];

                // If rejected, ensure at least one mark was updated AFTER the rejection
                if (workflow.status === 'Rejected') {
                    const changeCheckQuery = `
                        SELECT 1 FROM student_internal_marks 
                        WHERE subject_id = $1 AND updated_at > $2
                        AND entered_by_faculty_id = $3
                        LIMIT 1
                    `;
                    const changeCheckRes = await client.query(changeCheckQuery, [subject_id, workflow.updated_at, faculty_id]);
                    if (changeCheckRes.rowCount === 0) {
                        return res.status(400).json({ error: "Please update marks before resubmitting. No changes detected since rejection." });
                    }
                }

                await client.query(`UPDATE marks_workflow_status SET status = 'Submitted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [workflow.id]);
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

