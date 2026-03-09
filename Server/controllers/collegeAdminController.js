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

exports.getMarksTracking = async (req, res) => {
    try {
        const { college_id, semester_id } = req.query;
        let query = `
            SELECT DISTINCT mws.*, s.name as subject_name, ay.year_name as academic_year, sem.semester_name as semester, mp.name as program_name
            FROM marks_workflow_status mws
            LEFT JOIN master_subjects s ON mws.subject_id = s.id
            LEFT JOIN master_academic_years ay ON mws.academic_year_id = ay.id
            LEFT JOIN master_semesters sem ON mws.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps ON mws.subject_id = pps.subject_id AND mws.college_id = pps.college_id AND mws.semester_id = pps.semester_id
            LEFT JOIN master_programs mp ON pps.program_id = mp.id
            WHERE mws.college_id = $1
        `;
        let params = [college_id];
        if (semester_id) {
            query += ` AND mws.semester_id = $2`;
            params.push(semester_id);
        }
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch marks tracking overview" });
    }
};

exports.reviewMarks = async (req, res) => {
    try {
        const { subject_id, section, college_id } = req.query;
        // Fetch raw marks for all students for this subject
        const query = `
            SELECT sim.*, s.name as student_name, s.rollnumber
            FROM student_internal_marks sim
            JOIN students s ON sim.student_id = s.id
            WHERE sim.subject_id = $1
        `;
        const result = await db.query(query, [subject_id]);

        // Structure the response grouped by student, computing Best of 3 draft here if needed
        let studentsObj = {};
        for (let row of result.rows) {
            if (!studentsObj[row.student_id]) {
                studentsObj[row.student_id] = { student_id: row.student_id, student_name: row.student_name, rollnumber: row.rollnumber, marks: [] };
            }
            studentsObj[row.student_id].marks.push({
                component_id: row.component_id,
                marks_obtained: row.marks_obtained,
                is_absent: row.is_absent
            });
        }

        res.status(200).json(Object.values(studentsObj));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch marks for review" });
    }
};

exports.lockMarks = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.body;
        const approved_by = req.user ? req.user.id : null;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Fetch passing marks from structure
            const structReq = await client.query('SELECT component_name, passing_marks FROM internal_marks_structure WHERE subject_id = $1', [subject_id]);
            const passMarkEntry = structReq.rows.find(r => r.component_name === 'Total' || r.component_name === 'Best_of_3') || { passing_marks: 40 }; // Default 40
            const passMarks = parseFloat(passMarkEntry.passing_marks);

            // 2. Fetch all marks and structure config
            const marksData = await client.query('SELECT * FROM student_internal_marks WHERE subject_id = $1', [subject_id]);
            const components = await client.query('SELECT id, component_name FROM internal_marks_structure WHERE subject_id = $1', [subject_id]);
            const compMap = {};
            components.rows.forEach(c => compMap[c.id] = c.component_name);

            // Group by student
            let studentsScores = {};
            marksData.rows.forEach(row => {
                if (!studentsScores[row.student_id]) studentsScores[row.student_id] = { ia: [], practical: 0 };
                let score = row.is_absent ? 0 : parseFloat(row.marks_obtained);
                let cname = compMap[row.component_id];
                if (cname && cname.toUpperCase().includes('IA')) {
                    studentsScores[row.student_id].ia.push(score);
                } else if (cname && cname.toUpperCase().includes('PRACTICAL')) {
                    studentsScores[row.student_id].practical = score;
                }
            });

            // Calculate Best of 2 out of 3 IAs
            for (let sid in studentsScores) {
                let s = studentsScores[sid];
                s.ia.sort((a, b) => b - a);
                // Sum top 2 of IA
                let bestOf3 = (s.ia[0] || 0) + (s.ia[1] || 0);
                let total = bestOf3 + s.practical;
                let passStatus = total >= passMarks ? 'Pass' : 'Fail';

                await client.query(`
                    INSERT INTO calculated_internal_marks 
                    (student_id, subject_id, best_of_3_score, practical_score, total_internal, passing_status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (student_id, subject_id) 
                    DO UPDATE SET best_of_3_score = EXCLUDED.best_of_3_score, practical_score = EXCLUDED.practical_score, 
                    total_internal = EXCLUDED.total_internal, passing_status = EXCLUDED.passing_status, updated_at = CURRENT_TIMESTAMP
                `, [sid, subject_id, bestOf3, s.practical, total, passStatus]);
            }

            // 3. Update Workflow Status
            await client.query(`
                INSERT INTO marks_workflow_status 
                (college_id, subject_id, semester_id, academic_year_id, section, status, approved_by) 
                VALUES ($1, $2, $3, $4, $5, 'Locked', $6) 
                ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section) 
                DO UPDATE SET status = 'Locked', approved_by = EXCLUDED.approved_by, updated_at = CURRENT_TIMESTAMP
            `, [college_id, subject_id, semester_id, academic_year_id, section, approved_by]);

            // 4. Audit Log
            if (approved_by) {
                await client.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'MARKS_LOCKED', 'MARKS_WORKFLOW', $2)`,
                    [approved_by, subject_id]);
            }

            await client.query('COMMIT');
            res.status(200).json({ message: "Marks successfully locked and Best of 3 calculated!" });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to lock marks and calculate Best of 3" });
    }
};

exports.getMarksReport = async (req, res) => {
    try {
        const { college_id, semester_id, subject_id, academic_year_id } = req.query;

        let query = `
            SELECT 
                cim.*, 
                s.name as student_name, 
                s.rollnumber, 
                s."enrollmentNo",
                sub.name as subject_name, 
                sub.subject_code,
                sem.semester_name,
                ay.year_name as academic_year
            FROM calculated_internal_marks cim
            JOIN students s ON cim.student_id = s.id
            JOIN master_subjects sub ON cim.subject_id = sub.id
            JOIN (
                SELECT DISTINCT subject_id, college_id, semester_id, academic_year_id 
                FROM marks_workflow_status
                WHERE status = 'Locked'
            ) mws ON cim.subject_id = mws.subject_id
            JOIN master_semesters sem ON mws.semester_id = sem.id
            JOIN master_academic_years ay ON mws.academic_year_id = ay.id
            WHERE mws.college_id = $1
        `;
        let params = [college_id];
        let paramCount = 1;

        if (semester_id) {
            paramCount++;
            query += ` AND mws.semester_id = $${paramCount}`;
            params.push(semester_id);
        }
        if (subject_id) {
            paramCount++;
            query += ` AND cim.subject_id = $${paramCount}`;
            params.push(subject_id);
        }
        if (academic_year_id) {
            paramCount++;
            query += ` AND mws.academic_year_id = $${paramCount}`;
            params.push(academic_year_id);
        }

        query += ` ORDER BY sub.subject_code, s.rollnumber`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching marks report:", error);
        res.status(500).json({ error: "Failed to fetch marks report" });
    }
};
