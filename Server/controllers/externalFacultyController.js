const db = require('../db');

// --- External Faculty Action APIs ---

exports.getAssignedStudents = async (req, res) => {
    try {
        const faculty_user_id = req.user.id;
        
        // Query to handle both Subject-level and Exam-level assignments
        // If efa.subject_id IS NULL, we join with ALL marks for that exam
        // If efa.subject_id IS NOT NULL, we filter by that subject
        const query = `
            SELECT 
                efa.id as assignment_id, efa.status as assignment_status,
                er.id as registration_id, er.student_id, 
                CONCAT(s.first_name, ' ', s.last_name) as student_name, s.rollnumber,
                e_all.id as exam_id, e_all.name as exam_name, 
                sub.id as subject_id, sub.name as subject_name,
                m.id as mark_id, m.external_marks, m.status as marks_status,
                e_all.academic_year_id
            FROM external_faculty_assignments efa
            JOIN exams e_assigned ON efa.exam_id = e_assigned.id
            JOIN exams e_all ON e_assigned.name = e_all.name 
                             AND e_assigned.academic_year_id = e_all.academic_year_id 
                             AND e_assigned.semester_id = e_all.semester_id
            JOIN master_subjects sub ON e_all.subject_id = sub.id
            JOIN exam_registrations er ON er.exam_id = e_all.id AND er.payment_status = 'Paid'
            JOIN students s ON er.student_id = s.id
            LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = e_all.id
            WHERE efa.faculty_user_id = $1
              AND (efa.subject_id IS NULL OR efa.subject_id = sub.id)
            ORDER BY exam_name ASC, s.rollnumber ASC, sub.name ASC
        `;
        const result = await db.query(query, [faculty_user_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch assigned students" });
    }
};

exports.saveExternalMarks = async (req, res) => {
    const { marksData } = req.body; // [{ student_id, exam_id, subject_id, external_marks, academic_year_id }]
    const faculty_user_id = req.user.id;

    if (!marksData || !Array.isArray(marksData)) {
        return res.status(400).json({ error: "Invalid marks data." });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        for (const mark of marksData) {
            const { student_id, exam_id, subject_id, external_marks, academic_year_id } = mark;
            let total = parseFloat(external_marks || 0);
            
            // Enforce Max 70
            if (total > 70) total = 70;

            await client.query(`
                INSERT INTO marks (student_id, subject_id, exam_id, academic_year_id, external_marks, total_marks, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'Draft')
                ON CONFLICT (student_id, subject_id, exam_id) 
                DO UPDATE SET 
                    external_marks = EXCLUDED.external_marks,
                    total_marks = $6,
                    updated_at = CURRENT_TIMESTAMP
                WHERE marks.status != 'Approved'
            `, [student_id, subject_id, exam_id, academic_year_id, external_marks || 0, total]);

            // Update assignment status
            await client.query(`
                UPDATE external_faculty_assignments 
                SET status = 'Evaluated' 
                WHERE faculty_user_id = $1 AND exam_id = $2 
                  AND (subject_id = $3 OR subject_id IS NULL)
                  AND status != 'Submitted'
            `, [faculty_user_id, exam_id, subject_id]);
        }
        await client.query('COMMIT');
        res.status(200).json({ message: "Marks saved successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Failed to save marks" });
    } finally {
        client.release();
    }
};

exports.finalizeExternalMarks = async (req, res) => {
    const { exam_id, subject_ids } = req.body; 
    const faculty_user_id = req.user.id;

    if (!exam_id) {
        return res.status(400).json({ error: "Exam ID is required." });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // If subject_ids are provided, finalize those specifically
        // Otherwise finalize ALL for the exam assignment
        if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
            for (const subject_id of subject_ids) {
                await client.query(`
                    UPDATE marks 
                    SET status = 'Pending Approval' 
                    WHERE subject_id = $1 AND exam_id = $2 AND external_marks IS NOT NULL
                `, [subject_id, exam_id]);

                await client.query(`
                    UPDATE external_faculty_assignments 
                    SET status = 'Submitted' 
                    WHERE faculty_user_id = $1 AND exam_id = $2 AND subject_id = $3
                `, [faculty_user_id, exam_id, subject_id]);
            }
        } else {
            // Finalize everything for this exam assignment
            await client.query(`
                UPDATE marks 
                SET status = 'Pending Approval' 
                WHERE exam_id = $1 AND external_marks IS NOT NULL
                  AND student_id IN (SELECT student_id FROM exam_registrations WHERE exam_id = $1 AND payment_status = 'Paid')
            `, [exam_id]);

            await client.query(`
                UPDATE external_faculty_assignments 
                SET status = 'Submitted' 
                WHERE faculty_user_id = $1 AND exam_id = $2 AND subject_id IS NULL
            `, [faculty_user_id, exam_id]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: "Marks submitted to university successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Failed to finalize marks" });
    } finally {
        client.release();
    }
};
