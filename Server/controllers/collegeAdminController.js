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

exports.getPolicyMappings = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            SELECT 
                pps.id,
                mp.name as policy_name,
                md.department_name,
                mpr.name as program_name,
                ms.semester_name,
                msub.subject_code,
                msub.name as subject_name
            FROM policy_program_subjects pps
            JOIN master_policies mp ON pps.policy_id = mp.id
            JOIN master_departments md ON pps.department_id = md.id
            JOIN master_programs mpr ON pps.program_id = mpr.id
            JOIN master_semesters ms ON pps.semester_id = ms.id
            JOIN master_subjects msub ON pps.subject_id = msub.id
            WHERE pps.college_id = $1
            ORDER BY pps.id DESC
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch policy mappings" });
    }
};

exports.deletePolicyMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `DELETE FROM policy_program_subjects WHERE id = $1 AND college_id = $2 RETURNING *`;
        const result = await db.query(query, [id, college_id]);
        
        if (result.rowCount === 0) return res.status(404).json({ error: "Mapping not found or unauthorized" });
        res.status(200).json({ message: "Policy mapping deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete mapping" });
    }
};

exports.editPolicyMapping = async (req, res) => {
    try {
        const { id } = req.params;
        const { policy_id, program_id, semester_id, department_id, subject_id } = req.body;
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            UPDATE policy_program_subjects 
            SET policy_id = $1, program_id = $2, semester_id = $3, department_id = $4, subject_id = $5 
            WHERE id = $6 AND college_id = $7 
            RETURNING *;
        `;
        const result = await db.query(query, [policy_id, program_id, semester_id, department_id, subject_id, id, college_id]);

        if (result.rowCount === 0) return res.status(404).json({ error: "Mapping not found or unauthorized" });
        res.status(200).json({ message: "Policy mapping updated", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update mapping" });
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

exports.getAllMarksStructures = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            SELECT 
                ims.id,
                mp.name as policy_name,
                md.department_name,
                mpr.name as program_name,
                ms.semester_name,
                msub.subject_code,
                msub.name as subject_name,
                ims.component_name,
                ims.max_marks,
                ims.passing_marks
            FROM internal_marks_structure ims
            JOIN master_policies mp ON ims.policy_id = mp.id
            JOIN master_departments md ON ims.department_id = md.id
            JOIN master_programs mpr ON ims.program_id = mpr.id
            JOIN master_semesters ms ON ims.semester_id = ms.id
            JOIN master_subjects msub ON ims.subject_id = msub.id
            WHERE ims.college_id = $1
            ORDER BY ims.id DESC
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch all marks structures" });
    }
};

exports.deleteMarksStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `DELETE FROM internal_marks_structure WHERE id = $1 AND college_id = $2 RETURNING *`;
        const result = await db.query(query, [id, college_id]);
        
        if (result.rowCount === 0) return res.status(404).json({ error: "Marks structure not found or unauthorized" });
        res.status(200).json({ message: "Marks structure deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete marks structure" });
    }
};

exports.editMarksStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const { policy_id, program_id, semester_id, department_id, subject_id, component_name, max_marks, passing_marks } = req.body;
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            UPDATE internal_marks_structure 
            SET policy_id = $1, program_id = $2, semester_id = $3, department_id = $4, subject_id = $5, 
                component_name = $6, max_marks = $7, passing_marks = $8
            WHERE id = $9 AND college_id = $10
            RETURNING *;
        `;
        const result = await db.query(query, [policy_id, program_id, semester_id, department_id, subject_id, component_name, max_marks, passing_marks, id, college_id]);

        if (result.rowCount === 0) return res.status(404).json({ error: "Marks structure not found or unauthorized" });
        res.status(200).json({ message: "Marks structure updated", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update marks structure" });
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
            SELECT fs.*, u.name as faculty_name, s.name as subject_name, ay.year_name as academic_year, sem.semester_name as semester
            FROM faculty_subjects fs 
            LEFT JOIN master_teachers t ON fs.teacher_id = t.id 
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN master_subjects s ON fs.subject_id = s.id
            LEFT JOIN master_academic_years ay ON fs.academic_year_id = ay.id
            LEFT JOIN master_semesters sem ON fs.semester_id = sem.id
            WHERE fs.college_id = $1
       `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch faculty assignments" });
    }
};

exports.editFacultyAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { teacher_id, subject_id, semester_id, academic_year_id, section } = req.body;
        // The token verification middleware should put the user object, but since the assignment is cross-checked 
        // we omit college_id for a simple update, or we can require it
        
        const query = `
            UPDATE faculty_subjects 
            SET teacher_id = $1, subject_id = $2, semester_id = $3, academic_year_id = $4, section = $5
            WHERE id = $6
            RETURNING *;
        `;
        const result = await db.query(query, [teacher_id, subject_id, semester_id, academic_year_id, section, id]);

        if (result.rowCount === 0) return res.status(404).json({ error: "Faculty assignment not found" });
        res.status(200).json({ message: "Assignment updated successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Failed to update faculty assignment" });
    }
};

exports.deleteFacultyAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `DELETE FROM faculty_subjects WHERE id = $1 RETURNING *;`;
        const result = await db.query(query, [id]);
        
        if (result.rowCount === 0) return res.status(404).json({ error: "Faculty assignment not found" });
        res.status(200).json({ message: "Assignment deleted successfully" });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Failed to delete faculty assignment" });
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
