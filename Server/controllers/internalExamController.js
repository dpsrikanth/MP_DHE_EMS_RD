const db = require('../config/db');

// --- Internal Exam Round Management ---

exports.getRounds = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized: No college assigned" });

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
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            SELECT ies.id, ies.round_id, ies.program_id, ies.semester_id, ies.academic_year_id, 
                   ies.college_id, ies.subject_id, TO_CHAR(ies.exam_date, 'YYYY-MM-DD') as exam_date,
                   ies.start_time, ies.end_time,
                   ms.name as subject_name, ms.subject_code 
            FROM internal_exam_schedules ies
            JOIN master_subjects ms ON ies.subject_id = ms.id
            WHERE ies.round_id = $1 AND ies.program_id = $2 AND ies.semester_id = $3 
            AND ies.academic_year_id = $4 AND ies.college_id = $5
        `;
        const result = await db.query(query, [round_id, program_id, semester_id, academic_year_id, college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getSchedules error:", error);
        res.status(500).json({ error: "Failed to fetch schedules" });
    }
};

exports.saveSchedules = async (req, res) => {
    try {
        const { round_id, program_id, semester_id, academic_year_id, schedules } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

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

        const schedulingMilestone = milestones.find(m => {
            const mName = m.name.toUpperCase();
            const rName = String(roundName).toUpperCase();
            const rNum = rName.replace(/\D/g, "");

            const isTopicMatch = mName.includes(rName) || 
                            (rName.includes("IA") && rNum && (mName.includes("INTERNAL EXAM " + rNum) || mName.includes("MID-" + rNum))) ||
                            (rName.includes("MID") && rNum && mName.includes("INTERNAL EXAM " + rNum));
                            
            return isTopicMatch && mName.includes("SCHEDULE");
        });

        const settingsResult = await db.query("SELECT setting_value FROM system_settings WHERE setting_key = 'roadmap_validation'");
        const isValidationEnabled = settingsResult.rows.length > 0 ? settingsResult.rows[0].setting_value.enabled : true;

        if (isValidationEnabled && schedulingMilestone) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check Deadline
            if (schedulingMilestone.end_date) {
                const deadline = new Date(schedulingMilestone.end_date);
                deadline.setHours(23, 59, 59, 999);
                if (today > deadline) {
                    return res.status(403).json({ error: "Scheduling is closed for this exam. Deadline passed." });
                }
            }

            // Check Start Date
            if (schedulingMilestone.start_date) {
                const startDate = new Date(schedulingMilestone.start_date);
                startDate.setHours(0, 0, 0, 0);
                if (today < startDate) {
                    return res.status(403).json({ error: "Scheduling for this exam has not opened yet." });
                }
            }
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            for (const item of schedules) {
                const { subject_id, exam_date, start_time, end_time } = item;
                
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
        const college_id = req.user?.college_id;
        
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

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
