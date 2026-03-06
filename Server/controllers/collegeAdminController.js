const db = require('../db');

// --- Policy Mapping APIs ---
exports.mapPolicyToProgramSemester = async (req, res) => {
    try {
        const { policy_id, program_id, semester_id, department_id } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized: No college assigned" });

        const query = `
            INSERT INTO policy_program_semesters (college_id, policy_id, program_id, semester_id, department_id) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await db.query(query, [college_id, policy_id, program_id, semester_id, department_id]);
        res.status(201).json({ message: "Mapped successfully", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to map policy" });
    }
};

exports.mapSubjectsToPolicy = async (req, res) => {
    try {
        const { policy_id, program_id, semester_id, department_id, subject_id } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized: No college assigned" });

        const query = `
            INSERT INTO policy_program_subjects (college_id, policy_id, program_id, semester_id, department_id, subject_id) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const result = await db.query(query, [college_id, policy_id, program_id, semester_id, department_id, subject_id]);
        res.status(201).json({ message: "Subject mapped successfully", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to map subject" });
    }
};


// --- Internal Marks Structure APIs ---
exports.configureMarksStructure = async (req, res) => {
    try {
        const { policy_id, program_id, semester_id, department_id, subject_id, component_name, max_marks, passing_marks } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized: No college assigned" });

        const query = `
            INSERT INTO internal_marks_structure 
            (college_id, policy_id, program_id, semester_id, department_id, subject_id, component_name, max_marks, passing_marks) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            ON CONFLICT (college_id, policy_id, program_id, semester_id, subject_id, component_name) 
            DO UPDATE SET max_marks = EXCLUDED.max_marks, passing_marks = EXCLUDED.passing_marks
            RETURNING *;
        `;
        const result = await db.query(query, [college_id, policy_id, program_id, semester_id, department_id, subject_id, component_name, max_marks, passing_marks]);
        res.status(200).json({ message: "Marks structure configured", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to configure marks structure" });
    }
};

exports.getMarksStructure = async (req, res) => {
    try {
        const { subject_id } = req.params;
        const query = `SELECT * FROM internal_marks_structure WHERE subject_id = $1`;
        const result = await db.query(query, [subject_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch marks structure" });
    }
};

// --- Faculty Assignment APIs ---
exports.assignFacultyToSubject = async (req, res) => {
    try {
        const { teacher_id, subject_id, semester_id, academic_year_id, college_id, section } = req.body;
        const query = `
            INSERT INTO faculty_subjects (teacher_id, subject_id, semester_id, academic_year_id, college_id, section) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const result = await db.query(query, [teacher_id, subject_id, semester_id, academic_year_id, college_id, section]);
        res.status(201).json({ message: "Faculty assigned successfully", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to assign faculty" });
    }
};

exports.getFacultyAssignments = async (req, res) => {
    try {
        const { college_id } = req.params;
        const query = `
            SELECT fs.*, t.user_id, s.name as subject_name 
            FROM faculty_subjects fs 
            JOIN master_teachers t ON fs.teacher_id = t.id 
            JOIN master_subjects s ON fs.subject_id = s.id
            WHERE fs.college_id = $1
       `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch faculty assignments" });
    }
};


// --- Marks Verification & Approval Workflow APIs ---
exports.getMarksWorkflowStatus = async (req, res) => {
    try {
        const { college_id, semester_id } = req.query;
        let query = `SELECT * FROM marks_workflow_status WHERE college_id = $1`;
        let params = [college_id];
        if (semester_id) {
            query += ` AND semester_id = $2`;
            params.push(semester_id);
        }
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch workflow status" });
    }
};

exports.updateWorkflowStatus = async (req, res) => {
    try {
        const { college_id, subject_id, semester_id, academic_year_id, section, status } = req.body;
        const approved_by = req.user ? req.user.id : null; // Assuming auth middleware sets req.user

        const query = `
            INSERT INTO marks_workflow_status 
            (college_id, subject_id, semester_id, academic_year_id, section, status, approved_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section) 
            DO UPDATE SET status = EXCLUDED.status, approved_by = EXCLUDED.approved_by, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await db.query(query, [college_id, subject_id, semester_id, academic_year_id, section, status, approved_by]);

        // Audit log 
        if (approved_by) {
            await db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, 'MARKS_WORKFLOW', $3)`,
                [approved_by, `STATUS_CHANGED_TO_${status}`, result.rows[0].id]);
        }
        res.status(200).json({ message: `Workflow status updated to ${status}`, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update workflow status" });
    }
};
