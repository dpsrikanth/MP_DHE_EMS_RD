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

exports.getMarksStructureComponents = async (req, res) => {
    try {
        const { college_id, department_id, program_id, semester_id, subject_id } = req.query;
        
        console.log("DEBUG: getMarksStructureComponents called with:", {
            college_id, department_id, program_id, semester_id, subject_id
        });

        if (!college_id || !department_id || !program_id || !semester_id || !subject_id) {
            return res.status(400).json({ error: "Missing required query parameters" });
        }

        const query = `
            SELECT DISTINCT component_name 
            FROM internal_marks_structure 
            WHERE college_id = $1 
              AND department_id = $2 
              AND program_id = $3 
              AND semester_id = $4 
              AND subject_id = $5
            ORDER BY component_name;
        `;
        const params = [
            parseInt(college_id), 
            parseInt(department_id), 
            parseInt(program_id), 
            parseInt(semester_id), 
            parseInt(subject_id)
        ];
        
        if (params.some(p => isNaN(p))) {
            console.warn("DEBUG: Skipping query due to NaN parameters:", params);
            return res.status(200).json([]);
        }

        console.log("DEBUG: Executing query with params:", params);
        
        const result = await db.query(query, params);
        console.log("DEBUG: Query result rows:", result.rows.length, result.rows);
        
        res.status(200).json(result.rows.map(r => r.component_name));
    } catch (error) {
        console.error("Get components error:", error);
        res.status(500).json({ error: "Failed to fetch components" });
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
        const { semester_id } = req.query;
        let { college_id } = req.query;
        const { role, department_id, college_id: user_college_id } = req.user;

        // Security: For HOD and College Admin, ALWAYS use the college_id from their token
        if (role === 'HOD' || role === 'college_admin') {
            college_id = user_college_id;
        }

        let query = `
            SELECT DISTINCT fs.subject_id, fs.college_id, fs.semester_id, fs.academic_year_id, fs.section,
                   COALESCE(ws.status, 'Pending') as status,
                   ws.id,
                   ws.updated_at,
                   s.name as subject_name, sem.semester_name as semester, 
                   mp.name as program_name, md.department_name
            FROM faculty_subjects fs
            LEFT JOIN marks_workflow_status ws 
                 ON ws.subject_id = fs.subject_id AND ws.section = fs.section 
                 AND ws.college_id = fs.college_id AND ws.semester_id = fs.semester_id 
                 AND ws.academic_year_id = fs.academic_year_id
            LEFT JOIN master_subjects s ON fs.subject_id = s.id
            LEFT JOIN master_semesters sem ON fs.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps 
                 ON fs.subject_id = pps.subject_id AND fs.college_id = pps.college_id AND fs.semester_id = pps.semester_id
            LEFT JOIN master_programs mp ON pps.program_id = mp.id
            LEFT JOIN master_departments md ON pps.department_id = md.id
            WHERE 1=1
        `;

        let params = [];
        let paramCount = 0;

        if (college_id && college_id !== 'null') {
            paramCount++;
            query += ` AND fs.college_id = $${paramCount}`;
            params.push(college_id);
        } else if (role !== 'admin' && role !== 'superadmin' && role !== 'university_admin') {
            return res.status(400).json({ error: "College ID is required" });
        }

        if (semester_id && semester_id !== 'null') {
            paramCount++;
            query += ` AND fs.semester_id = $${paramCount}`;
            params.push(semester_id);
        }

        // HOD filtering
        if (role === 'HOD' && department_id) {
            paramCount++;
            query += ` AND (pps.department_id = $${paramCount} OR pps.department_id IS NULL)`;
            params.push(department_id);
        }

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getMarksWorkflowStatus error:", error);
        res.status(500).json({ error: "Failed to fetch workflow status" });
    }
};

exports.updateWorkflowStatus = async (req, res) => {
    try {
        const { college_id, subject_id, semester_id, academic_year_id, section, status } = req.body;
        const { id: approved_by, role } = req.user;

        // Ensure IDs are integers
        const cId = parseInt(college_id);
        const sId = parseInt(subject_id);
        const semId = parseInt(semester_id);
        const ayId = parseInt(academic_year_id);

        // Security: Only allow specific roles for specific status changes
        if (status === 'Locked' && role !== 'college_admin' && role !== 'admin' && role !== 'superadmin') {
            return res.status(403).json({ error: "Only College Admins can lock marks" });
        }
        if ((status === 'Approved' || status === 'Rejected') && (role !== 'HOD' && role !== 'college_admin' && role !== 'admin' && role !== 'superadmin')) {
            return res.status(403).json({ error: "Unauthorized status change" });
        }

        let finalStatus = status;
        let responseMessage = `Workflow status updated to ${status}`;

        // If trying to approve, check if any individual students are rejected
        if (status === 'Approved') {
            const rejectionCheck = await db.query(
                `SELECT 1 FROM student_marks_review 
                 WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 
                 AND academic_year_id = $4 AND section = $5 AND status = 'Rejected' LIMIT 1`,
                [cId, sId, semId, ayId, section]
            );

            if (rejectionCheck.rowCount > 0) {
                finalStatus = 'Rejected';
                responseMessage = "Section rejected due to individual student-wise rejections. Faculty can now edit rejected records.";
            }
        }

        const query = `
            INSERT INTO marks_workflow_status 
            (college_id, subject_id, semester_id, academic_year_id, section, status, approved_by) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section) 
            DO UPDATE SET status = EXCLUDED.status, approved_by = EXCLUDED.approved_by, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await db.query(query, [cId, sId, semId, ayId, section, finalStatus, approved_by]);

        // Audit log 
        if (approved_by) {
            await db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, 'MARKS_WORKFLOW', $3)`,
                [approved_by, `STATUS_CHANGED_TO_${finalStatus}`, result.rows[0].id]);
        }
        res.status(200).json({ message: responseMessage, data: result.rows[0], status: finalStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update workflow status" });
    }
};

exports.getMarksAuditLog = async (req, res) => {
    try {
        const { subject_id, workflow_id } = req.query;

        if (!subject_id) {
            return res.status(400).json({ error: "Missing required parameter: subject_id" });
        }

        const query = `
            SELECT al.action, al.created_at, u.name as user_name, mr.role_name
            FROM audit_logs al
            JOIN users u ON al.user_id = u.id
            JOIN master_roles mr ON u.role_id = mr.id
            WHERE al.entity_type = 'MARKS_WORKFLOW' 
              AND al.entity_id IN ($1, $2)
            ORDER BY al.created_at ASC
        `;

        const result = await db.query(query, [subject_id, workflow_id || -1]);
        
        // Calculate dynamic revision
        let currentRevision = 1;
        const timeline = result.rows.map(row => {
            const entry = { ...row, revision: currentRevision };
            if (row.action === 'MARKS_SUBMITTED' || row.action === 'CORRECTION_REQUESTED') {
                // If it's a resubmission, it generally indicates a new revision loop, wait, actually let's bump BEFORE submitting if needed, or just let MARKS_SUBMITTED be the indicator of a "Revision X".
                // If we see a MARKS_SUBMITTED after a rejection, that is a new revision.
                // An easy way: just bump revision after we see an unlock/rejection, so the next submit is the next rev.
            }
            return entry;
        });

        // Better logic for revisions: count how many times it was submitted
        let submissionCount = 0;
        let finalTimeline = [];
        for (let row of result.rows) {
            if (row.action === 'MARKS_SUBMITTED') {
                submissionCount++;
            }
            // All actions after a submission logically belong to that submission's "Revision N"
            // Actions before ANY submission (like maybe some pre-setup) belong to Revision 0 or 1
            finalTimeline.push({
                ...row,
                revision: Math.max(1, submissionCount)
            });
        }

        // Reverse so the newest is at the top
        finalTimeline.reverse();

        res.status(200).json(finalTimeline);
    } catch (error) {
        console.error("Error fetching marks audit log:", error);
        res.status(500).json({ error: "Failed to fetch marks audit log" });
    }
};

exports.getMarksTracking = async (req, res) => {
    try {
        const { college_id, semester_id } = req.query;
        let query = `
            SELECT DISTINCT mws.*, s.name as subject_name, ay.year_name as academic_year, sem.semester_name as semester, 
                   mp.name as program_name, c.name as college_name
            FROM marks_workflow_status mws
            LEFT JOIN master_subjects s ON mws.subject_id = s.id
            LEFT JOIN master_academic_years ay ON mws.academic_year_id = ay.id
            LEFT JOIN master_semesters sem ON mws.semester_id = sem.id
            LEFT JOIN policy_program_subjects pps ON mws.subject_id = pps.subject_id AND mws.college_id = pps.college_id AND mws.semester_id = pps.semester_id
            LEFT JOIN master_programs mp ON pps.program_id = mp.id
            LEFT JOIN colleges c ON mws.college_id = c.id
            WHERE 1=1
        `;

        let params = [];
        let paramCount = 0;

        // Only filter by college_id if it's a valid value (not 'null' or empty)
        if (college_id && college_id !== 'null' && college_id !== 'undefined') {
            paramCount++;
            query += ` AND mws.college_id = $${paramCount}`;
            params.push(college_id);
        }

        if (semester_id && semester_id !== 'null' && semester_id !== 'undefined') {
            paramCount++;
            query += ` AND mws.semester_id = $${paramCount}`;
            params.push(semester_id);
        }

        // Filter out Pending status by default for verification/approval workflows
        if (req.query.exclude_pending === 'true') {
            query += ` AND mws.status != 'Pending'`;
        }
        
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getMarksTracking error:", error);
        res.status(500).json({ error: "Failed to fetch marks tracking overview" });
    }
};


exports.reviewMarks = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.query;
        const { role, department_id } = req.user;

        // Security: HOD can only review their department's subjects
        if (role === 'HOD' && department_id) {
            const deptCheck = await db.query(
                `SELECT 1 FROM policy_program_subjects 
                 WHERE subject_id = $1 AND college_id = $2 AND department_id = $3`,
                [subject_id, college_id, department_id]
            );
            if (deptCheck.rows.length === 0) {
                return res.status(403).json({ error: "Unauthorized: Subject does not belong to your department" });
            }
        }

        // Fetch raw marks for all students for this subject
        // NOTE: smr.section filter is ONLY in the LEFT JOIN, NOT in WHERE —
        // putting it in WHERE converts the LEFT JOIN to an INNER JOIN and hides
        // students whose marks haven't been individually reviewed yet (smr row is NULL).
        const query = `
            SELECT sim.*, s.name as student_name, s.rollnumber, 
                   smr.status as review_status, smr.comment as review_comment
            FROM student_internal_marks sim
            JOIN students s ON sim.student_id = s.id
            LEFT JOIN student_marks_review smr ON sim.student_id = smr.student_id 
                AND sim.subject_id = smr.subject_id 
                AND smr.section = $2 
                AND smr.college_id = $3
                AND smr.semester_id = $4
                AND smr.academic_year_id = $5
            WHERE sim.subject_id = $1 
              AND s."collageName" IN (SELECT name FROM colleges WHERE id = $3)
        `;
        const result = await db.query(query, [subject_id, section, college_id, semester_id, academic_year_id]);

        // Structure the response grouped by student
        let studentsObj = {};
        for (let row of result.rows) {
            if (!studentsObj[row.student_id]) {
                studentsObj[row.student_id] = {
                    student_id: row.student_id,
                    student_name: row.student_name,
                    rollnumber: row.rollnumber,
                    review_status: row.review_status || 'Pending',
                    review_comment: row.review_comment || '',
                    marks: []
                };
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

exports.saveStudentReview = async (req, res) => {
    try {
        const { college_id, subject_id, semester_id, academic_year_id, section, student_id, status, comment } = req.body;
        const { id: reviewed_by, role, department_id } = req.user;

        // Security: HOD can only review their department's subjects
        if (role === 'HOD' && department_id) {
            const deptCheck = await db.query(
                `SELECT 1 FROM policy_program_subjects 
                 WHERE subject_id = $1 AND college_id = $2 AND department_id = $3`,
                [subject_id, college_id, department_id]
            );
            if (deptCheck.rows.length === 0) {
                return res.status(403).json({ error: "Unauthorized: Subject does not belong to your department" });
            }
        }

        const query = `
            INSERT INTO student_marks_review 
            (college_id, subject_id, semester_id, academic_year_id, section, student_id, status, comment, reviewed_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section, student_id)
            DO UPDATE SET status = EXCLUDED.status, comment = EXCLUDED.comment, reviewed_by = EXCLUDED.reviewed_by, updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await db.query(query, [college_id, subject_id, semester_id, academic_year_id, section, student_id, status, comment, reviewed_by]);

        res.status(200).json({ message: "Student review saved", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save student review" });
    }
};

exports.rejectWorkflow = async (req, res) => {
    try {
        const { college_id, subject_id, semester_id, academic_year_id, section } = req.body;
        const rejected_by = req.user ? req.user.id : null;

        const query = `
            UPDATE marks_workflow_status 
            SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP 
            WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5
            RETURNING *;
        `;
        const result = await db.query(query, [college_id, subject_id, semester_id, academic_year_id, section]);

        if (rejected_by) {
            await db.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'MARKS_REJECTED', 'MARKS_WORKFLOW', $2)`,
                [rejected_by, subject_id]);
        }

        res.status(200).json({ message: "Workflow rejected and sent back to faculty", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reject workflow" });
    }
};

exports.lockMarks = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id, studentsGraceMarks } = req.body;
        const { id: approved_by, role } = req.user;

        if (role !== 'college_admin' && role !== 'admin' && role !== 'superadmin') {
            return res.status(403).json({ error: "Only College Admins can lock marks" });
        }

        // Ensure IDs are integers
        const sId = parseInt(subject_id);
        const cId = parseInt(college_id);
        const semId = parseInt(semester_id);
        const ayId = parseInt(academic_year_id);

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // 1. Check review statuses for all students in this section
            const reviewStatusQuery = `
                SELECT status FROM student_marks_review 
                WHERE subject_id = $1 AND section = $2 AND college_id = $3 
                AND semester_id = $4 AND academic_year_id = $5
            `;
            const reviewStatusRes = await client.query(reviewStatusQuery, [sId, section, cId, semId, ayId]);

            const rejections = reviewStatusRes.rows.filter(r => r.status === 'Rejected');

            if (rejections.length > 0) {
                // If any rejection exists, set global status to Rejected and DON'T calculate
                await client.query(`
                    INSERT INTO marks_workflow_status 
                    (college_id, subject_id, semester_id, academic_year_id, section, status, approved_by) 
                    VALUES ($1, $2, $3, $4, $5, 'Rejected', $6) 
                    ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section) 
                    DO UPDATE SET status = 'Rejected', approved_by = EXCLUDED.approved_by, updated_at = CURRENT_TIMESTAMP
                `, [cId, sId, semId, ayId, section, approved_by]);

                await client.query('COMMIT');
                return res.status(200).json({
                    message: "Section rejected due to student-wise rejections. Faculty can now edit rejected records.",
                    status: 'Rejected'
                });
            }

            // If we reach here, all students are Approved. Proceed with Locking and Calculation.

            // Fetch all marks and structure config for THIS college
            const marksDataQuery = `
                SELECT sim.* 
                FROM student_internal_marks sim
                JOIN students s ON sim.student_id = s.id
                JOIN colleges c ON s."collageName" ILIKE c.name
                WHERE sim.subject_id = $1 AND c.id = $2
            `;
            const marksData = await client.query(marksDataQuery, [sId, cId]);
            
            // Filter by BOTH subject and college to ensure data isolation
            const components = await client.query('SELECT id, component_name, passing_marks FROM internal_marks_structure WHERE subject_id = $1 AND college_id = $2', [sId, cId]);
            
            if (components.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: "No marks structure found for this subject at your college." });
            }

            const compMap = {};
            const compPassMap = {};
            components.rows.forEach(c => {
                compMap[c.id] = c.component_name;
                compPassMap[c.id] = parseFloat(c.passing_marks) || 0;
            });

            // Group by student
            let studentsScores = {};
            marksData.rows.forEach(row => {
                if (!studentsScores[row.student_id]) studentsScores[row.student_id] = { ia: [], practical: 0, hasFailedComponent: false };
                let score = row.is_absent ? 0 : parseFloat(row.marks_obtained);
                let cname = compMap[row.component_id];
                let pMark = compPassMap[row.component_id] || 0;

                if (cname) {
                    let upperCname = cname.toUpperCase();
                    if (upperCname.includes('IA')) {
                        studentsScores[row.student_id].ia.push({ score, pMark });
                    } else if (upperCname.includes('PRACTICAL')) {
                        studentsScores[row.student_id].practical += score;
                        if (score < pMark) {
                            studentsScores[row.student_id].hasFailedComponent = true;
                        }
                    } else if (!upperCname.includes('TOTAL') && !upperCname.includes('BEST_OF_3')) {
                        if (score < pMark) {
                            studentsScores[row.student_id].hasFailedComponent = true;
                        }
                    }
                }
            });

            // Calculate Best of 2 out of 3 IAs and determine Pass/Fail
            for (let sid in studentsScores) {
                let s = studentsScores[sid];
                const studentId = parseInt(sid); // CRITICAL FIX: keys are strings, db needs integers

                // Cumulative Pass Calculation setup
                let cumulativePassMarks = 0;
                let hasExplicitTotal = false;
                let iaPassMarks = [];
                let otherPassMarks = 0;

                components.rows.forEach(c => {
                    let cname = c.component_name ? c.component_name.toUpperCase() : '';
                    if (cname.includes('TOTAL') || cname.includes('BEST_OF_3')) {
                        cumulativePassMarks = parseFloat(c.passing_marks) || 0;
                        hasExplicitTotal = true;
                    } else if (cname.includes('IA')) {
                        iaPassMarks.push(parseFloat(c.passing_marks) || 0);
                    } else {
                        otherPassMarks += parseFloat(c.passing_marks) || 0;
                    }
                });

                if (!hasExplicitTotal) {
                    iaPassMarks.sort((a, b) => b - a);
                    cumulativePassMarks = (iaPassMarks[0] || 0) + (iaPassMarks[1] || 0) + otherPassMarks;
                }

                // Process Student's specific IA scores
                s.ia.sort((a, b) => b.score - a.score);
                let bestOf2Score = (s.ia[0]?.score || 0) + (s.ia[1]?.score || 0);

                // Apply Grace Marks
                const graceInfo = studentsGraceMarks && studentsGraceMarks[studentId] ? studentsGraceMarks[studentId] : { marks: 0, reason: '' };
                const graceMarks = parseFloat(graceInfo.marks) || 0;
                const graceReason = graceInfo.reason || '';

                let total = bestOf2Score + s.practical + graceMarks;
                let passStatus = total >= cumulativePassMarks ? 'Pass' : 'Fail';

                await client.query(`
                    INSERT INTO calculated_internal_marks 
                    (student_id, subject_id, college_id, semester_id, academic_year_id, best_of_3_score, practical_score, total_internal, passing_status, grace_marks, grace_marks_reason)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (student_id, subject_id, college_id, semester_id, academic_year_id) 
                    DO UPDATE SET best_of_3_score = EXCLUDED.best_of_3_score, practical_score = EXCLUDED.practical_score, 
                    total_internal = EXCLUDED.total_internal, passing_status = EXCLUDED.passing_status, 
                    grace_marks = EXCLUDED.grace_marks, grace_marks_reason = EXCLUDED.grace_marks_reason,
                    updated_at = CURRENT_TIMESTAMP
                `, [studentId, sId, cId, semId, ayId, bestOf2Score, s.practical, total, passStatus, graceMarks, graceReason]);
            }

            // 3. Update Workflow Status to Locked
            const statusUpdateRes = await client.query(`
                INSERT INTO marks_workflow_status 
                (college_id, subject_id, semester_id, academic_year_id, section, status, approved_by) 
                VALUES ($1, $2, $3, $4, $5, 'Locked', $6) 
                ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section) 
                DO UPDATE SET status = 'Locked', approved_by = EXCLUDED.approved_by, updated_at = CURRENT_TIMESTAMP
                RETURNING id
            `, [cId, sId, semId, ayId, section, approved_by]);

            // 4. Audit Log
            if (approved_by) {
                const workflowId = statusUpdateRes.rows[0]?.id;
                await client.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'MARKS_LOCKED', 'MARKS_WORKFLOW', $2)`,
                    [approved_by, workflowId || sId]);
            }

            await client.query('COMMIT');
            res.status(200).json({ message: "All student records approved. Marks locked and Best of 3 calculated!", status: 'Locked' });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Lock Marks Error:", error);
        // CRITICAL DEBUG: Passing raw error message to toast
        res.status(500).json({ error: `DB Error: ${error.message}` });
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

// Updated unlockMarks to handle multiple roles and statuses
exports.unlockMarks = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.body;
        const { role, id: user_id } = req.user;

        // Allowed roles for this operation
        const allowedRoles = ['admin', 'college_admin', 'HOD'];
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ error: "Insufficient permissions to unlock marks" });
        }

        // Fetch current workflow status
        const statusRes = await db.query(
            `SELECT status FROM marks_workflow_status WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5`,
            [college_id, subject_id, semester_id, academic_year_id, section]
        );
        if (statusRes.rowCount === 0) {
            return res.status(404).json({ error: "Workflow record not found" });
        }
        const currentStatus = statusRes.rows[0].status;

        // 1️⃣ HOD approves a correction request (status = 'Correction Requested')
        if (role === 'HOD' && currentStatus === 'Correction Requested') {
            await db.query(
                `UPDATE marks_workflow_status SET status = 'Rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE college_id = $2 AND subject_id = $3 AND semester_id = $4 AND academic_year_id = $5 AND section = $6`,
                [user_id, college_id, subject_id, semester_id, academic_year_id, section]
            );
            await db.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'CORRECTION_APPROVED_BY_HOD', 'MARKS_WORKFLOW', $2)`,
                [user_id, subject_id]
            );
            return res.status(200).json({ message: "Correction request approved – marks unlocked for editing" });
        }

        // 2️⃣ College Admin rejects after HOD sent back (status = 'Locked')
        if (role === 'college_admin' && currentStatus === 'Locked') {
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                // Set status to Rejected (editable)
                await client.query(
                    `UPDATE marks_workflow_status SET status = 'Rejected', approved_by = $6, updated_at = CURRENT_TIMESTAMP 
                     WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5`,
                    [college_id, subject_id, semester_id, academic_year_id, section, user_id]
                );
                // Clean up reviews and calculated marks (same as original unlock)
                await client.query(
                    `DELETE FROM student_marks_review WHERE subject_id = $1 AND section = $2 AND college_id = $3 AND semester_id = $4 AND academic_year_id = $5`,
                    [subject_id, section, college_id, semester_id, academic_year_id]
                );
                await client.query(
                    `DELETE FROM calculated_internal_marks WHERE subject_id = $1 AND college_id = $2 AND semester_id = $3 AND academic_year_id = $4`,
                    [subject_id, college_id, semester_id, academic_year_id]
                );
                await client.query(
                    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'CORRECTION_REJECTED_BY_COLLEGE', 'MARKS_WORKFLOW', $2)`,
                    [user_id, subject_id]
                );
                await client.query('COMMIT');
                return res.status(200).json({ message: "Correction request rejected – marks unlocked for editing" });
            } catch (inner) {
                await client.query('ROLLBACK');
                console.error('Unlock error (college_admin):', inner);
                return res.status(500).json({ error: "Failed to unlock marks (college admin)" });
            } finally {
                client.release();
            }
        }

        // 3️⃣ System admin (or generic admin) – original behavior: reset to Pending (no edit allowed)
        if (role === 'admin') {
            const client = await db.connect();
            try {
                await client.query('BEGIN');
                await client.query(
                    `UPDATE marks_workflow_status SET status = 'Pending', approved_by = NULL, updated_at = CURRENT_TIMESTAMP 
                     WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5`,
                    [college_id, subject_id, semester_id, academic_year_id, section]
                );
                await client.query('COMMIT');
                return res.status(200).json({ message: "Marks unlocked to Pending (admin)" });
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('Admin unlock error:', e);
                return res.status(500).json({ error: "Failed to unlock marks (admin)" });
            } finally {
                client.release();
            }
        }

        // Fallback – unsupported transition
        return res.status(400).json({ error: "Unsupported unlock operation for current role/status" });
    } catch (error) {
        console.error("unlockMarks error:", error);
        res.status(500).json({ error: "Failed to process unlock request" });
    }
};

// New endpoint: HOD sends correction request back to college for review
exports.sendBackCorrection = async (req, res) => {
    try {
        const { subject_id, section, college_id, semester_id, academic_year_id } = req.body;
        const { role, id: user_id } = req.user;
        if (role !== 'HOD') {
            return res.status(403).json({ error: "Only HOD can send correction back to college" });
        }
        // Verify there is a pending correction request
        const statusRes = await db.query(
            `SELECT status FROM marks_workflow_status WHERE college_id = $1 AND subject_id = $2 AND semester_id = $3 AND academic_year_id = $4 AND section = $5`,
            [college_id, subject_id, semester_id, academic_year_id, section]
        );
        if (statusRes.rowCount === 0) return res.status(404).json({ error: "Workflow not found" });
        const curStatus = statusRes.rows[0].status;
        if (curStatus !== 'Correction Requested') {
            return res.status(400).json({ error: "No correction request to send back" });
        }
        // Insert notification for college admin
        await db.query(
            `INSERT INTO college_notifications (college_id, subject_id, section, message) VALUES ($1, $2, $3, $4)`,
            [college_id, subject_id, section, 'HOD sent correction request back to college for review']
        );
        await db.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, 'CORRECTION_SENT_BACK_TO_COLLEGE', 'MARKS_WORKFLOW', $2)`,
            [user_id, subject_id]
        );
        return res.status(200).json({ message: "Correction request sent back to college" });
    } catch (err) {
        console.error('sendBackCorrection error:', err);
        res.status(500).json({ error: 'Failed to send correction back to college' });
    }
};

// --- Total Rooms Config ---
exports.getCollegeTotalRooms = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const result = await db.query('SELECT total_rooms FROM colleges WHERE id = $1', [college_id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "College not found" });

        res.json({ total_rooms: result.rows[0].total_rooms || 0 });
    } catch (error) {
        console.error("Get total rooms error:", error);
        res.status(500).json({ error: "Failed to get total rooms" });
    }
};

exports.updateCollegeTotalRooms = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const { total_rooms } = req.body;
        if (total_rooms === undefined || total_rooms === null) {
            return res.status(400).json({ error: "Total rooms value is required" });
        }

        await db.query('UPDATE colleges SET total_rooms = $1 WHERE id = $2', [parseInt(total_rooms), college_id]);
        res.json({ message: "Total rooms updated successfully", total_rooms });
    } catch (error) {
        console.error("Update total rooms error:", error);
        res.status(500).json({ error: "Failed to update total rooms" });
    }
};

exports.getStudentsForRollGeneration = async (req, res) => {
    try {
        const { college_id, role } = req.user || {};
        const { programName, semister, admission_year } = req.query;

        const isSuperUser = role === 'system_admin' || role === 'university_admin' || role === 'university';
        if (!college_id && !isSuperUser) return res.status(403).json({ error: "Unauthorized" });

        let query = `
            SELECT s.id, s.name, s.rollnumber as current_rollnumber, s."programName", s.semister, s.admission_year
            FROM students s
            JOIN colleges c ON c.name ILIKE s."collageName"
            WHERE s."deleteStatus" = true
        `;
        let params = [];
        let pCount = 0;

        if (!isSuperUser) {
            pCount++;
            query += ` AND c.id = $${pCount}`;
            params.push(college_id);
        }

        if (programName) {
            pCount++;
            query += ` AND s."programName" = $${pCount}`;
            params.push(programName);
        }

        if (semister) {
            pCount++;
            query += ` AND s.semister = $${pCount}`;
            params.push(semister);
        }

        if (admission_year) {
            pCount++;
            query += ` AND s.admission_year = $${pCount}`;
            params.push(admission_year);
        }

        query += ` ORDER BY s.name ASC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get students for roll generation error:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

exports.allocateRollNumbers = async (req, res) => {
    try {
        const { college_id, role } = req.user || {};
        const { generatedMappings } = req.body; 

        const isSuperUser = role === 'system_admin' || role === 'university_admin' || role === 'university';
        if (!college_id && !isSuperUser) return res.status(403).json({ error: "Unauthorized" });
        if (!generatedMappings || !Array.isArray(generatedMappings) || generatedMappings.length === 0) {
            return res.status(400).json({ error: "No roll numbers generated" });
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            for (const map of generatedMappings) {
                // Update student table
                await client.query(
                    `UPDATE students SET rollnumber = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
                    [map.rollnumber, map.id]
                );
            }

            await client.query('COMMIT');
            res.status(200).json({ message: "Roll numbers successfully assigned to students." });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Allocate roll numbers error:", error);
        res.status(500).json({ error: "Failed to assign roll numbers", details: error.message });
    }
};

exports.getCollegeDashboardStats = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        // Get Total Students
        const studentCountRes = await db.query(
            `SELECT COUNT(*) FROM public.students 
             WHERE "collageName" ILIKE (SELECT name FROM colleges WHERE id = $1) 
             AND "deleteStatus" = true`,
            [college_id]
        );

        // Get Total Faculty
        const facultyCountRes = await db.query(
            `SELECT COUNT(*) FROM public.users 
             WHERE college_id = $1 
             AND role_id IN (SELECT id FROM public.roles WHERE role_name IN ('Faculty', 'Teacher', 'HOD'))`,
            [college_id]
        );

        // Get Total Halls and Capacity
        const hallStatsRes = await db.query(
            `SELECT COUNT(*) as hall_count, COALESCE(SUM(rows * seats_per_row), 0) as total_capacity 
             FROM public.examination_halls 
             WHERE college_id = $1 AND status = 'Approved'`,
            [college_id]
        );

        // Get Pending Approvals (include Correction Requested in pending count)
        const pendingApprovalsRes = await db.query(
            `SELECT COUNT(*) FROM public.marks_workflow_status 
             WHERE college_id = $1 AND status IN ('Submitted', 'Correction Requested')`,
            [college_id]
        );

        // Get Active Exams (Assigned to this college or university wide)
        const activeExamsRes = await db.query(
            `SELECT COUNT(*) FROM public.exams 
             WHERE (college_id = $1 OR college_id IS NULL) AND (status = true OR status IS NULL)`,
            [college_id]
        );

        res.status(200).json({
            totalStudents: parseInt(studentCountRes.rows[0].count),
            totalFaculty: parseInt(facultyCountRes.rows[0].count),
            totalHalls: parseInt(hallStatsRes.rows[0].hall_count),
            totalCapacity: parseInt(hallStatsRes.rows[0].total_capacity),
            pendingApprovals: parseInt(pendingApprovalsRes.rows[0].count),
            activeExams: parseInt(activeExamsRes.rows[0].count)
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};

// (Duplicate unlockMarks removed — see enhanced version above at line ~838)

exports.getCollegeNotifications = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        const query = `
            SELECT 
                cn.*, 
                ms.name as subject_name,
                ms.subject_code
            FROM college_notifications cn
            LEFT JOIN master_subjects ms ON cn.subject_id = ms.id
            WHERE cn.college_id = $1 AND cn.read_at IS NULL
            ORDER BY cn.created_at DESC
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getCollegeNotifications error:", error);
        // If table doesn't exist (code 42P01), return empty array
        if (error.code === '42P01') {
            return res.status(200).json([]);
        }
        res.status(500).json({ error: "Failed to fetch notifications", message: error.message });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "No college assigned" });

        const query = `
            UPDATE college_notifications 
            SET read_at = CURRENT_TIMESTAMP 
            WHERE id = $1 AND college_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [id, college_id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("markNotificationRead error:", error);
        res.status(500).json({ error: "Failed to update notification" });
    }
};

// --- HOD Assessment Acceptance ---

exports.getPendingComponentApprovals = async (req, res) => {
    try {
        const { college_id, role } = req.user;
        if (role !== 'HOD' && role !== 'college_admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const query = `
            SELECT 
                fs.subject_id, fs.semester_id, fs.academic_year_id, fs.section,
                ms.name as subject_name, ms.subject_code,
                mse.semester_name,
                may.year_name,
                ims.id as component_id, ims.component_name, ims.max_marks,
                COUNT(DISTINCT sim.student_id) as student_count,
                COALESCE(ca.is_accepted, FALSE) as is_accepted,
                ca.accepted_at
            FROM faculty_subjects fs
            JOIN master_subjects ms ON fs.subject_id = ms.id
            JOIN master_semesters mse ON fs.semester_id = mse.id
            JOIN master_academic_years may ON fs.academic_year_id = may.id
            JOIN internal_marks_structure ims ON ims.subject_id = fs.subject_id AND ims.college_id = fs.college_id
            JOIN student_internal_marks sim ON sim.component_id = ims.id
            LEFT JOIN component_acceptance ca ON ca.college_id = fs.college_id 
                AND ca.subject_id = fs.subject_id 
                AND ca.semester_id = fs.semester_id
                AND ca.academic_year_id = fs.academic_year_id
                AND ca.section = fs.section
                AND ca.component_id = ims.id
            WHERE fs.college_id = $1
            GROUP BY 
                fs.subject_id, fs.semester_id, fs.academic_year_id, fs.section,
                ms.name, ms.subject_code, mse.semester_name, may.year_name,
                ims.id, ims.component_name, ims.max_marks, ca.is_accepted, ca.accepted_at
            HAVING COUNT(DISTINCT sim.student_id) > 0
            ORDER BY fs.subject_id, fs.section, ims.id
        `;

        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getPendingComponentApprovals error:", error);
        res.status(500).json({ error: "Failed to fetch pending assessments" });
    }
};

exports.acceptComponent = async (req, res) => {
    try {
        const { college_id, id: user_id, role } = req.user;
        if (role !== 'HOD' && role !== 'college_admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { subject_id, semester_id, academic_year_id, section, component_id } = req.body;

        const query = `
            INSERT INTO component_acceptance 
                (college_id, subject_id, semester_id, academic_year_id, section, component_id, is_accepted, accepted_by)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
            ON CONFLICT (college_id, subject_id, semester_id, academic_year_id, section, component_id)
            DO UPDATE SET 
                is_accepted = TRUE,
                accepted_by = $7,
                accepted_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        const result = await db.query(query, [
            college_id, subject_id, semester_id, academic_year_id, section, component_id, user_id
        ]);

        // Audit Log
        await db.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
             VALUES ($1, 'COMPONENT_ACCEPTED', 'ASSESSMENT', $2, $3)`,
            [user_id, component_id, JSON.stringify(req.body)]
        );

        res.status(200).json({ message: "Assessment accepted successfully", data: result.rows[0] });
    } catch (error) {
        console.error("acceptComponent error:", error);
        res.status(500).json({ error: "Failed to accept assessment" });
    }
};

