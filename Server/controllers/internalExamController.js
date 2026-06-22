const db = require('../config/db');

// Roles that operate across colleges and may target a specific college via request.
// Compared case-insensitively (covers "superadmin"/"superAdmin" etc.).
const SUPER_ROLES = ['superadmin', 'admin', 'system_admin', 'university_admin', 'university'];

// Resolve the effective college_id for an internal-exam request.
// - College-scoped users (college_admin / HOD): always their own college; any
//   college_id in the request is ignored (they cannot reach another college).
// - Super / University admins: have no college of their own, so they must supply
//   one via query (GET) or body (POST) — e.g. from the college picker in the UI.
const resolveCollegeId = (req) => {
    const isSuperUser = SUPER_ROLES.includes((req.user?.role || '').toLowerCase());
    if (isSuperUser) {
        const fromReq = req.query?.college_id ?? req.body?.college_id;
        return fromReq ? parseInt(fromReq, 10) : null;
    }
    return req.user?.college_id || null;
};

// --- Internal Exam Round Management ---

exports.getRounds = async (req, res) => {
    try {
        const college_id = resolveCollegeId(req);
        if (!college_id) return res.status(403).json({ error: "No college selected. Please select a college." });

        // Fetch custom rounds AND distinct components from marks structure
        const query = `
            SELECT id::text, name, 'custom' as type FROM internal_exam_rounds WHERE college_id = $1 AND status = true
            UNION
            SELECT component_name as id, component_name as name, 'structure' as type 
            FROM internal_marks_structure 
            WHERE college_id = $1
            ORDER BY name ASC
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getRounds error:", error);
        res.status(500).json({ error: "Failed to fetch exam rounds" });
    }
};

exports.createRound = async (req, res) => {
    try {
        const { name } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized: No college assigned" });
        if (!name) return res.status(400).json({ error: "Round name is required" });

        const query = `INSERT INTO internal_exam_rounds (name, college_id) VALUES ($1, $2) RETURNING *`;
        const result = await db.query(query, [name, college_id]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("createRound error:", error);
        res.status(500).json({ error: "Failed to create exam round" });
    }
};

// --- Internal Exam Scheduling ---

exports.getSchedules = async (req, res) => {
    try {
        const { round_id, program_id, semester_id, academic_year_id } = req.query;
        const college_id = resolveCollegeId(req);

        if (!college_id) return res.status(403).json({ error: "No college selected. Please select a college." });

        // college_id is always required; the rest narrow the result when provided.
        // The scheduling page sends all filters; the calendar sends only college_id
        // and expects every schedule for that college.
        const conditions = ['ies.college_id = $1'];
        const params = [college_id];
        let i = 2;
        if (round_id) { conditions.push(`ies.round_id = $${i++}`); params.push(round_id); }
        if (program_id) { conditions.push(`ies.program_id = $${i++}`); params.push(program_id); }
        if (semester_id) { conditions.push(`ies.semester_id = $${i++}`); params.push(semester_id); }
        if (academic_year_id) { conditions.push(`ies.academic_year_id = $${i++}`); params.push(academic_year_id); }

        const query = `
            SELECT ies.id, ies.round_id, ies.program_id, ies.semester_id, ies.academic_year_id,
                   ies.college_id, ies.subject_id, TO_CHAR(ies.exam_date, 'YYYY-MM-DD') as exam_date,
                   ies.start_time, ies.end_time,
                   ms.name as subject_name, ms.subject_code
            FROM internal_exam_schedules ies
            JOIN master_subjects ms ON ies.subject_id = ms.id
            WHERE ${conditions.join(' AND ')}
        `;
        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getSchedules error:", error);
        res.status(500).json({ error: "Failed to fetch schedules" });
    }
};

exports.saveSchedules = async (req, res) => {
    try {
        const { round_id, program_id, semester_id, academic_year_id, schedules } = req.body;
        const college_id = resolveCollegeId(req);

        if (!college_id) return res.status(403).json({ error: "No college selected. Please select a college." });

        // Duplicate Date Validation
        const dates = (schedules || []).map(s => s.exam_date).filter(Boolean);
        if (new Set(dates).size !== dates.length) {
            return res.status(400).json({ error: "Duplicate exam dates detected. Each subject must be scheduled on a unique date." });
        }
        // Fetch the academic year to determine its time range for filtering milestones
        let academicYearStart = null, academicYearEnd = null;
        if (academic_year_id) {
            const ayResult = await db.query("SELECT year_name FROM master_academic_years WHERE id = $1", [academic_year_id]);
            if (ayResult.rows.length > 0) {
                const parts = (ayResult.rows[0].year_name || '').split('-');
                if (parts.length >= 2) {
                    academicYearStart = parseInt(parts[0]);
                    academicYearEnd = parseInt(parts[1]);
                }
            }
        }

        const milestonesResult = await db.query(
            "SELECT * FROM academic_milestones WHERE (college_id = $1 OR college_id IS NULL) AND delete_status = true",
            [college_id]
        );
        const milestones = milestonesResult.rows;

        let roundName = round_id;
        const roundInfo = await db.query(
            "SELECT name FROM internal_exam_rounds WHERE id::text = $1 AND college_id = $2",
            [round_id, college_id]
        );
        if (roundInfo.rows.length > 0) roundName = roundInfo.rows[0].name;

        // Find scheduling milestone that matches the round name AND falls within the selected academic year
        const schedulingMilestone = milestones
            .filter(m => {
                // Filter by academic context
                if (semester_id && m.semester_id && String(m.semester_id) !== String(semester_id)) return false;
                if (program_id && m.program_id && String(m.program_id) !== String(program_id)) return false;
                if (academic_year_id && m.academic_year_id && String(m.academic_year_id) !== String(academic_year_id)) return false;

                // Filter by academic year if we have the year range
                if (academicYearStart && m.start_date) {
                    const mYear = new Date(m.start_date).getFullYear();
                    if (mYear !== academicYearStart && mYear !== academicYearEnd) return false;
                }
                const mName = m.name.toUpperCase();
                const rName = String(roundName).toUpperCase();
                const rNum = rName.replace(/\D/g, "");
                const isTopicMatch = mName.includes(rName) ||
                    (rName.includes("IA") && rNum && (mName.includes("INTERNAL EXAM " + rNum) || mName.includes("MID-" + rNum))) ||
                    (rName.includes("MID") && rNum && mName.includes("INTERNAL EXAM " + rNum));
                return isTopicMatch && mName.includes("SCHEDULE");
            })
            // Prefer the milestone whose start_date year matches the academic year's start year
            .sort((a, b) => {
                if (!academicYearStart) return 0;
                const aYear = new Date(a.start_date).getFullYear();
                const bYear = new Date(b.start_date).getFullYear();
                const aDiff = Math.abs(aYear - academicYearStart);
                const bDiff = Math.abs(bYear - academicYearStart);
                return aDiff - bDiff;
            })[0] || null;

        const settingsResult = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'roadmap_validation'");
        const isValidationEnabled = settingsResult.rows.length > 0 ? settingsResult.rows[0].setting_value.enabled : true;

        if (isValidationEnabled && schedulingMilestone) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check Start Date first — "not yet open" takes priority over deadline
            if (schedulingMilestone.start_date) {
                const startDate = new Date(schedulingMilestone.start_date);
                startDate.setHours(0, 0, 0, 0);
                if (today < startDate) {
                    return res.status(403).json({ error: "Scheduling for this exam has not started yet. Please wait until the scheduling window opens." });
                }
            }

            // Then check Deadline
            if (schedulingMilestone.end_date) {
                const deadline = new Date(schedulingMilestone.end_date);
                deadline.setHours(23, 59, 59, 999);
                if (today > deadline) {
                    return res.status(403).json({ error: "Scheduling is closed for this exam. Deadline passed." });
                }
            }
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            for (const item of schedules) {
                const { subject_id, exam_date, start_time, end_time } = item;
                
                // Sunday Validation (getUTCDay is safe for YYYY-MM-DD strings)
                if (new Date(exam_date).getUTCDay() === 0) {
                    await client.query('ROLLBACK');
                    client.release();
                    return res.status(400).json({ error: `Exams cannot be scheduled on Sundays (${exam_date}). Sundays are institutional holidays.` });
                }

                const query = `
                    INSERT INTO internal_exam_schedules 
                    (round_id, program_id, semester_id, academic_year_id, college_id, subject_id, exam_date, start_time, end_time)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (round_id, subject_id, college_id, semester_id)
                    DO UPDATE SET 
                        exam_date = EXCLUDED.exam_date,
                        start_time = EXCLUDED.start_time,
                        end_time = EXCLUDED.end_time
                `;
                await client.query(query, [round_id, program_id, semester_id, academic_year_id, college_id, subject_id, exam_date, start_time, end_time]);
            }

            await client.query('COMMIT');
            res.status(200).json({ message: "Schedules saved successfully" });
        } catch (innerError) {
            await client.query('ROLLBACK');
            throw innerError;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("saveSchedules error:", error);
        res.status(500).json({ error: "Failed to save schedules" });
    }
};

exports.getAvailableContexts = async (req, res) => {
    try {
        const { round_id } = req.query; // component_name
        const college_id = resolveCollegeId(req);

        if (!college_id) return res.status(403).json({ error: "No college selected. Please select a college." });

        if (!round_id) {
            return res.status(200).json({ programs: [], semesters: [] });
        }

        // We check if this round is a 'structure' round (component_name in internal_marks_structure)
        const query = `
            SELECT DISTINCT program_id, semester_id 
            FROM internal_marks_structure 
            WHERE college_id = $1 AND component_name = $2
        `;
        const result = await db.query(query, [college_id, round_id]);
        
        const programs = [...new Set(result.rows.map(r => r.program_id))];
        const semesters = [...new Set(result.rows.map(r => r.semester_id))];
        const mapping = result.rows; // Array of {program_id, semester_id}

        res.status(200).json({ programs, semesters, mapping });
    } catch (error) {
        console.error("getAvailableContexts error:", error);
        res.status(500).json({ error: "Failed to fetch available contexts" });
    }
};
