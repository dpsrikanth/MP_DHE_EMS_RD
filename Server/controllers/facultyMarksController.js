const db = require('../config/db');

// --- Faculty Marks Entry APIs ---

exports.getAssignedSubjects = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        console.log(`[DEBUG] getAssignedSubjects called for teacher_id: ${teacher_id}`);
        const query = `
            SELECT fs.*, ms.name as subject_name, ms.subject_code, 
                   COALESCE(pps.program_id, ims.program_id) as program_id, 
                   sem.semester_name,
                   EXISTS (
                       SELECT 1 FROM internal_exam_schedules ies
                       WHERE ies.subject_id = fs.subject_id
                         AND ies.semester_id = fs.semester_id
                         AND ies.college_id = fs.college_id
                   ) AS has_schedule
            FROM faculty_subjects fs
            JOIN master_subjects ms ON fs.subject_id = ms.id
            JOIN master_semesters sem ON fs.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps 
                 ON fs.subject_id = pps.subject_id 
                 AND fs.college_id = pps.college_id 
                 AND fs.semester_id = pps.semester_id
            LEFT JOIN (
                SELECT DISTINCT subject_id, college_id, program_id 
                FROM internal_marks_structure
            ) ims 
                 ON fs.subject_id = ims.subject_id 
                 AND fs.college_id = ims.college_id 
            WHERE fs.teacher_id = $1 AND fs.status = 'Active'
        `;
        const result = await db.query(query, [teacher_id]);
        console.log(`[DEBUG] Found ${result.rows.length} subjects for teacher_id: ${teacher_id}`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("[DEBUG] Error in getAssignedSubjects:", error);
        res.status(500).json({ error: "Failed to fetch assigned subjects" });
    }
};

exports.getStudentsForSubject = async (req, res) => {
    try {
        const { college_id, program_id, semester_id } = req.query;
        console.log(`[DEBUG] getStudentsForSubject called with: college_id=${college_id}, program_id=${program_id}, semester_id=${semester_id}`);

        // Fetch string names for matching with students table
        const colRes = await db.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
        const progRes = await db.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);

        if (colRes.rowCount === 0) {
            console.error(`[DEBUG] College not found for ID: ${college_id}`);
            return res.status(200).json([]);
        }

        const collageName = colRes.rows[0].name;
        
        let programName = null;
        if (program_id && program_id !== 'null' && program_id !== 'undefined') {
            const progRes = await db.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
            if (progRes.rowCount > 0) {
                programName = progRes.rows[0].name;
            }
        }

        if (!programName) {
            console.warn(`[DEBUG] Program name not found for ID: ${program_id}. Returning empty student list.`);
            return res.status(200).json([]);
        }

        let semesterName = null;
        if (semester_id && semester_id !== 'null' && semester_id !== 'undefined') {
            const semRes = await db.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);
            if (semRes.rowCount > 0) {
                semesterName = semRes.rows[0].semester_name;
            }
        }

        if (!programName || !semesterName) {
            console.warn(`[DEBUG] Program (${programName}) or Semester (${semesterName}) not found. Returning empty student list.`);
            return res.status(200).json([]);
        }

        // Apply strict filtering by program AND semester
        const query = `
            SELECT * FROM students 
            WHERE "collageName" ILIKE $1 
              AND "programName" ILIKE $2 
              AND "semister" ILIKE $3
              AND "deleteStatus" = true
            ORDER BY rollnumber ASC NULLS LAST, name ASC
        `;
        const result = await db.query(query, [collageName, programName, semesterName]);
        console.log(`[DEBUG] Found ${result.rows.length} students for ${collageName} / ${programName}`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

exports.getEnteredMarks = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.query;
        let query = `
            SELECT sim.* 
            FROM student_internal_marks sim
            JOIN internal_marks_structure ims ON sim.component_id = ims.id
            WHERE sim.subject_id = $1 AND ims.college_id = $2
        `;
        let params = [subject_id, college_id];

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
            let globalStatus = checkRes.rows.length > 0 ? checkRes.rows[0].status : 'Pending';

            // If the section is rejected or correction is requested, allow editing regardless of component acceptance
            if (!['Locked', 'Approved', 'Rejected', 'Correction Requested'].includes(globalStatus) && marksData[0].component_id) {
                 const caQuery = `
                      SELECT is_accepted FROM component_acceptance
                      WHERE college_id = $1 AND subject_id = $2 AND component_id = $3 AND section = $4
                 `;
                 const caRes = await db.query(caQuery, [college_id, subject_id, marksData[0].component_id, section]);
                 if (caRes.rowCount > 0) {
                      globalStatus = caRes.rows[0].is_accepted ? 'Approved' : 'Submitted';
                 } else {
                      globalStatus = 'Pending';
                 }
            }

            if (['Approved', 'Locked', 'Submitted'].includes(globalStatus)) {
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
        const { subject_id, component_id, section, faculty_id, college_id, semester_id, academic_year_id } = req.body;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // --- ADDED VALIDATION: Ensure all students have marks entered ---
            if (component_id) {
                // 1. Get context names
                const colRes = await client.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
                const semRes = await client.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);
                const subRes = await client.query('SELECT program_id FROM master_subjects WHERE id = $1', [subject_id]);
                
                if (colRes.rowCount === 0 || semRes.rowCount === 0) {
                    throw new Error("Invalid college or semester ID");
                }

                const collageName = colRes.rows[0].name;
                const semesterName = semRes.rows[0].semester_name;
                const programId = subRes.rows[0]?.program_id;

                let programName = null;
                if (programId) {
                    const progRes = await client.query('SELECT name FROM master_programs WHERE id = $1', [programId]);
                    if (progRes.rowCount > 0) programName = progRes.rows[0].name;
                }

                // 2. Count expected students
                let studentsQuery = `
                    SELECT COUNT(DISTINCT s.id) as total_students 
                    FROM students s 
                    WHERE s."collageName" ILIKE $1 
                      AND s."semister" ILIKE $2
                      AND s."deleteStatus" = true
                `;
                let queryParams = [collageName, semesterName];
                if (programName) {
                    studentsQuery += ` AND s."programName" ILIKE $3`;
                    queryParams.push(programName);
                }
                const studentsCountRes = await client.query(studentsQuery, queryParams);
                const totalStudents = parseInt(studentsCountRes.rows[0].total_students);

                // 3. Count students with entered marks (or absent status)
                const marksCountRes = await client.query(`
                    SELECT COUNT(DISTINCT student_id) as entered_count 
                    FROM student_internal_marks 
                    WHERE subject_id = $1 AND component_id = $2
                `, [subject_id, component_id]);
                const enteredCount = parseInt(marksCountRes.rows[0].entered_count);

                if (enteredCount < totalStudents) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ 
                        error: `Incomplete marks. Only ${enteredCount} of ${totalStudents} students have marks recorded. Please ensure all students have marks or are marked as Absent before submitting.` 
                    });
                }

                // Internal Exam Marks Workflow
                const caQuery = `
                    INSERT INTO component_acceptance 
                    (college_id, subject_id, semester_id, academic_year_id, section, component_id, is_accepted, accepted_by)
                    VALUES ($1, $2, $3, $4, $5, $6, FALSE, NULL)
                    ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section, component_id)
                    DO UPDATE SET is_accepted = FALSE
                `;
                await client.query(caQuery, [college_id, subject_id, semester_id, academic_year_id, section, component_id]);
            } else {
                // General Marks Workflow - Validation: Ensure ALL components have marks for ALL students
                // 1. Get components for this subject
                const compQuery = `SELECT id, component_name FROM internal_marks_structure WHERE subject_id = $1 AND college_id = $2`;
                const compRes = await client.query(compQuery, [subject_id, college_id]);
                const components = compRes.rows;
                const componentIds = components.map(c => c.id);

                if (componentIds.length === 0) {
                     return res.status(400).json({ error: "No marks structure defined for this subject. Cannot submit." });
                }

                // 2. Get students for context
                const colRes = await client.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
                const semRes = await client.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);
                if (colRes.rowCount === 0 || semRes.rowCount === 0) return res.status(400).json({ error: "Invalid context" });

                const collageName = colRes.rows[0].name;
                const semesterName = semRes.rows[0].semester_name;
                
                // Fetch program name if available
                let programName = null;
                if (program_id && program_id !== 'null' && program_id !== 'undefined') {
                    const progRes = await client.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
                    if (progRes.rowCount > 0) programName = progRes.rows[0].name;
                }

                let studentCountQuery = `SELECT COUNT(DISTINCT id) as count FROM students WHERE "collageName" ILIKE $1 AND "semister" ILIKE $2`;
                let scParams = [collageName, semesterName];
                if (programName) {
                    studentCountQuery += ` AND "programName" ILIKE $3`;
                    scParams.push(programName);
                }
                const scRes = await client.query(studentCountQuery, scParams);
                const totalStudents = parseInt(scRes.rows[0].count);

                // 3. Count marks entered for these students and these components
                // We need to count records in student_internal_marks for (student_id in context) AND (component_id in list)
                const marksCountQuery = `
                    SELECT COUNT(*) as count 
                    FROM student_internal_marks 
                    WHERE subject_id = $1 AND component_id = ANY($2)
                `;
                const marksCountRes = await client.query(marksCountQuery, [subject_id, componentIds]);
                const enteredMarksCount = parseInt(marksCountRes.rows[0].count);

                const expectedCount = totalStudents * componentIds.length;

                if (enteredMarksCount < expectedCount) {
                    return res.status(400).json({ 
                        error: "Incomplete marks detected. Please ensure all internal assessment rounds (IA1, IA2, etc.) are filled for all students before submitting to HOD."
                    });
                }

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
            } else if (!component_id) {
                await client.query(`
                    INSERT INTO marks_workflow_status 
                    (college_id, subject_id, semester_id, academic_year_id, section, status) 
                    VALUES ($1, $2, $3, $4, $5, 'Submitted')
                `, [college_id, subject_id, semester_id, academic_year_id, section]);
            }
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

exports.requestUnlock = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.body;
        const faculty_id = req.user ? req.user.id : null;

        if (!faculty_id) return res.status(401).json({ error: "Unauthorized" });

        const query = `
            UPDATE marks_workflow_status 
            SET status = 'Correction Requested', updated_at = CURRENT_TIMESTAMP 
            WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5
            AND status IN ('Submitted', 'Locked')
            RETURNING *;
        `;
        const result = await db.query(query, [college_id, subject_id, semester_id, academic_year_id, section]);

        if (result.rowCount === 0) {
            return res.status(400).json({ error: "No submitted marks found to request correction for." });
        }

        await db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'CORRECTION_REQUESTED', 'MARKS_WORKFLOW', $2)`,
            [faculty_id, subject_id]);

        res.status(200).json({ message: "Correction request sent to HOD", data: result.rows[0] });
    } catch (error) {
        console.error("requestUnlock error:", error);
        res.status(500).json({ error: "Failed to send correction request" });
    }
};

// --- Faculty Attendance APIs ---

exports.getAttendance = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id, attendance_date, period_number } = req.query;

        const query = `
            SELECT * FROM student_attendance 
            WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5
            AND attendance_date = $6 AND period_number = $7
        `;
        const result = await db.query(query, [subject_id, section, college_id, semester_id, academic_year_id, attendance_date, period_number || 1]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get attendance error:", error);
        res.status(500).json({ error: "Failed to fetch attendance" });
    }
};

exports.saveAttendance = async (req, res) => {
    try {
        const { attendanceData, subject_id, section, college_id, semester_id, academic_year_id, teacher_id, attendance_date, period_number } = req.body;
        // attendanceData = [{ student_id, status }] (status: 'Present' | 'Absent')

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            for (let data of attendanceData) {
                const query = `
                    INSERT INTO student_attendance 
                    (student_id, subject_id, college_id, semester_id, academic_year_id, teacher_id, attendance_date, period_number, status, section)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (student_id, subject_id, college_id, semester_id, attendance_date, period_number, section) 
                    DO UPDATE SET 
                        updated_at = CURRENT_TIMESTAMP,
                        status = EXCLUDED.status,
                        teacher_id = EXCLUDED.teacher_id
                `;
                await client.query(query, [
                    data.student_id, subject_id, college_id, semester_id, academic_year_id, teacher_id, 
                    attendance_date, period_number || 1, data.status, section
                ]);
            }
            await client.query('COMMIT');

            if (req.user && req.user.id) {
                await db.query(`INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, 'ATTENDANCE_ENTERED', 'ATTENDANCE')`, [req.user.id]);
            }

            res.status(200).json({ message: "Attendance saved successfully" });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Save attendance error:", error);
        res.status(500).json({ error: "Failed to save attendance" });
    }
};

exports.getAttendanceSummary = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id, startDate, endDate } = req.query;

        let dateFilter = "";
        const queryParams = [subject_id, section, college_id, semester_id, academic_year_id];

        if (startDate && endDate) {
            dateFilter = ` AND attendance_date BETWEEN $6 AND $7`;
            queryParams.push(startDate, endDate);
        }

        // Count total sessions taken in this period
        const totalSessionsQuery = `
            SELECT COUNT(DISTINCT (attendance_date, period_number)) as total_sessions 
            FROM student_attendance 
            WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5
            ${dateFilter}
        `;
        const totalRes = await db.query(totalSessionsQuery, queryParams);
        const totalSessions = parseInt(totalRes.rows[0].total_sessions) || 0;

        // Count 'Present' occurrences per student in this period
        const presentQuery = `
            SELECT student_id, COUNT(*) as present_count 
            FROM student_attendance 
            WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5
            AND status = 'Present'
            ${dateFilter}
            GROUP BY student_id
        `;
        const presentRes = await db.query(presentQuery, queryParams);
        
        res.status(200).json({ totalSessions, summary: presentRes.rows });
    } catch (error) {
        console.error("Get attendance summary error:", error);
        res.status(500).json({ error: "Failed to fetch attendance summary" });
    }
};

exports.getAvailableRounds = async (req, res) => {
    try {
        const { teacher_id, academic_year_id, semester_id } = req.query;
        const collegesRes = await db.query('SELECT DISTINCT college_id FROM faculty_subjects WHERE teacher_id = $1', [teacher_id]);
        
        if (collegesRes.rowCount === 0) return res.json([]);
        
        const collegeIds = collegesRes.rows.map(r => r.college_id);
        
        let query = `
            SELECT DISTINCT round_id as id, round_id as name
            FROM internal_exam_schedules
            WHERE college_id = ANY($1)
        `;
        const params = [collegeIds];

        if (academic_year_id && academic_year_id !== 'null' && academic_year_id !== 'undefined') {
            query += ` AND academic_year_id = $${params.length + 1}`;
            params.push(academic_year_id);
        }

        if (semester_id && semester_id !== 'null' && semester_id !== 'undefined') {
            query += ` AND semester_id = $${params.length + 1}`;
            params.push(semester_id);
        }

        query += ` ORDER BY name ASC`;
        
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getAvailableRounds error:", error);
        res.status(500).json({ error: "Failed to fetch rounds" });
    }
};

exports.getStudentsForRound = async (req, res) => {
    try {
        const { subject_id, round_name, college_id, semester_id, academic_year_id, section, program_id } = req.query;

        const structRes = await db.query(`
            SELECT id, max_marks, passing_marks 
            FROM internal_marks_structure 
            WHERE subject_id = $1 AND college_id = $2 AND component_name = $3
        `, [subject_id, college_id, round_name]);

        let componentId = null;
        let structure = null;
        if (structRes.rowCount > 0) {
            componentId = structRes.rows[0].id;
            structure = structRes.rows[0];
        }

        const colRes = await db.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
        const semRes = await db.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);
        
        let programName = null;
        if (program_id && program_id !== 'null' && program_id !== 'undefined') {
            const progRes = await db.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
            if (progRes.rowCount > 0) programName = progRes.rows[0].name;
        }

        if (colRes.rowCount === 0 || semRes.rowCount === 0) {
            return res.status(400).json({ error: "Invalid context" });
        }

        const collageName = colRes.rows[0].name;
        const semesterName = semRes.rows[0].semester_name;

        let studentsQuery = `
            SELECT DISTINCT s.id, s.name, s.rollnumber 
            FROM students s 
            WHERE s."collageName" ILIKE $1 
              AND s."semister" ILIKE $2
        `;
        let queryParams = [collageName, semesterName];

        if (programName) {
            studentsQuery += ` AND s."programName" ILIKE $3`;
            queryParams.push(programName);
        }

        const studentsRes = await db.query(studentsQuery, queryParams);

        let marks = [];
        if (componentId) {
            const marksQuery = `
                SELECT student_id, marks_obtained, is_absent 
                FROM student_internal_marks 
                WHERE subject_id = $1 AND component_id = $2
            `;
            const marksRes = await db.query(marksQuery, [subject_id, componentId]);
            marks = marksRes.rows;
        }

        let workflowStatus = 'Pending';
        const statusQuery = `
            SELECT status FROM marks_workflow_status 
            WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5
        `;
        const statusRes = await db.query(statusQuery, [college_id, subject_id, semester_id, academic_year_id, section]);
        const globalStatus = statusRes.rowCount > 0 ? statusRes.rows[0].status : 'Pending';

        if (globalStatus === 'Locked' || globalStatus === 'Approved') {
             workflowStatus = globalStatus;
        } else if (componentId) {
             const caQuery = `
                  SELECT is_accepted FROM component_acceptance
                  WHERE college_id = $1 AND subject_id = $2 AND component_id = $3 AND section = $4
             `;
             const caRes = await db.query(caQuery, [college_id, subject_id, componentId, section]);
             if (caRes.rowCount > 0) {
                 workflowStatus = caRes.rows[0].is_accepted ? 'Approved' : 'Submitted';
             }
        }

        res.status(200).json({
            students: studentsRes.rows,
            marks: marks,
            component_id: componentId,
            structure: structure,
            workflowStatus: workflowStatus
        });

    } catch (error) {
        console.error("getStudentsForRound error:", error);
        res.status(500).json({ error: "Failed to fetch student marks context" });
    }
};

exports.bulkUploadInternalMarks = async (req, res) => {
    const client = await db.connect();
    try {
        const { marks, subject_id, component_id, faculty_id, college_id, semester_id, academic_year_id, section } = req.body;

        if (!marks || !Array.isArray(marks) || !subject_id) {
            return res.status(400).json({ error: "Invalid payload. Marks data and Subject ID are required." });
        }

        // Fetch marks structure for validation
        const structureRes = await client.query(
            'SELECT id, component_name, max_marks FROM internal_marks_structure WHERE subject_id = $1',
            [parseInt(subject_id)]
        );
        const structureMap = {};
        structureRes.rows.forEach(row => {
            structureMap[row.id] = row;
        });

        await client.query('BEGIN');

        let errors = [];
        let successCount = 0;

        for (let i = 0; i < marks.length; i++) {
            const record = marks[i];
            const rowNum = i + 1;
            const enrollmentNo = record.enrollment_number || record.rollnumber;

            if (!enrollmentNo) {
                errors.push({ row: rowNum, message: "Missing Enrollment No / Roll Number" });
                continue;
            }

            // Lookup student_id
            const studentRes = await client.query(
                'SELECT id FROM students WHERE TRIM(rollnumber) = $1',
                [enrollmentNo.toString().trim()]
            );

            if (studentRes.rows.length === 0) {
                errors.push({ row: rowNum, message: `Student with ID ${enrollmentNo} not found.` });
                continue;
            }

            const studentId = studentRes.rows[0].id;
            
            // Handle both single-component and multi-component payloads
            const marksToProcess = [];
            if (record.component_id || component_id) {
                const compId = parseInt(record.component_id || component_id);
                const mObtained = record.marks_obtained !== undefined && record.marks_obtained !== '' ? parseFloat(record.marks_obtained) : 0;
                
                // Validation
                const compInfo = structureMap[compId];
                if (compInfo && !isNaN(mObtained) && mObtained > compInfo.max_marks) {
                    errors.push({ row: rowNum, message: `Marks for ${compInfo.component_name} (${mObtained}) exceed maximum allowed (${compInfo.max_marks})` });
                    continue;
                }

                marksToProcess.push({
                    component_id: compId,
                    marks_obtained: isNaN(mObtained) ? 0 : mObtained,
                    is_absent: record.is_absent === true || record.is_absent === 'true' || record.is_absent === 'ABSENT'
                });
            } else if (record.components && typeof record.components === 'object') {
                let rowHasError = false;
                Object.entries(record.components).forEach(([id, data]) => {
                    const compId = parseInt(id);
                    const mObtained = data.marks !== undefined && data.marks !== '' ? parseFloat(data.marks) : 0;
                    
                    // Validation
                    const compInfo = structureMap[compId];
                    if (compInfo && !isNaN(mObtained) && mObtained > compInfo.max_marks) {
                        errors.push({ row: rowNum, message: `Marks for ${compInfo.component_name} (${mObtained}) exceed maximum allowed (${compInfo.max_marks})` });
                        rowHasError = true;
                    }

                    if (!rowHasError) {
                        marksToProcess.push({
                            component_id: compId,
                            marks_obtained: isNaN(mObtained) ? 0 : mObtained,
                            is_absent: data.is_absent === true || data.is_absent === 'true' || data.is_absent === 'ABSENT'
                        });
                    }
                });
                if (rowHasError) continue;
            }

            for (const m of marksToProcess) {
                if (!m.component_id) continue;
                const query = `
                    INSERT INTO student_internal_marks 
                    (student_id, subject_id, component_id, marks_obtained, is_absent, entered_by_faculty_id) 
                    VALUES ($1, $2, $3, $4, $5, $6) 
                    ON CONFLICT (student_id, component_id) 
                    DO UPDATE SET 
                        updated_at = CURRENT_TIMESTAMP,
                        marks_obtained = EXCLUDED.marks_obtained, 
                        is_absent = EXCLUDED.is_absent
                `;
                await client.query(query, [
                    studentId, 
                    parseInt(subject_id), 
                    m.component_id, 
                    m.marks_obtained, 
                    m.is_absent, 
                    faculty_id ? parseInt(faculty_id) : null
                ]);
            }
            successCount++;
        }

        if (errors.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Import rejected. Found ${errors.length} validation error(s). No records were imported.`,
                errors: errors
            });
        }

        await client.query('COMMIT');
        res.status(200).json({ 
            message: `Successfully processed all ${successCount} records.`,
            errors: []
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("bulkUploadInternalMarks error:", error);
        res.status(500).json({ error: "Failed to perform bulk upload of internal marks", details: error.message });
    } finally {
        if (client) client.release();
    }
};

