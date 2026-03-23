const db = require('../db');

const DEFAULT_CONFIG = {
    grade_scale: [
        { min: 90, grade: 'O', points: 10 },
        { min: 80, grade: 'A+', points: 9 },
        { min: 70, grade: 'A', points: 8 },
        { min: 60, grade: 'B+', points: 7 },
        { min: 50, grade: 'B', points: 6 },
        { min: 40, grade: 'C', points: 5 },
        { min: 0, grade: 'F', points: 0 }
    ],
    pass_threshold: 40,
    calculate_sgpa_on_earned_only: false,
    subject_credits: {}
};

/**
 * Fetches the grading configuration for the university associated with the user.
 */
exports.getGradingConfig = async (req, res) => {
    try {
        let universityId = req.user.university_id || req.user.college_id;

        // SuperAdmin can override universityId via query param
        const isHighLevel = req.user.role === 'superAdmin' || req.user.role === 'admin';
        if (isHighLevel && req.query.targetUniversityId) {
            universityId = req.query.targetUniversityId;
        }

        if (!universityId) {
            return res.status(400).json({ message: "University ID not found for user" });
        }

        // Check if the universityId we have is actually a college_id and we need the university_id
        // (This handles cases where req.user only had college_id)
        const collegeCheck = await db.query('SELECT university_id FROM colleges WHERE id = $1', [universityId]);
        if (collegeCheck.rows.length > 0 && collegeCheck.rows[0].university_id) {
            universityId = collegeCheck.rows[0].university_id;
        }

        const result = await db.query(
            'SELECT * FROM grading_configs WHERE university_id = $1',
            [universityId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json({ ...DEFAULT_CONFIG, university_id: universityId, is_default: true });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("getGradingConfig error:", error);
        res.status(500).json({ message: "Failed to fetch grading configuration" });
    }
};

/**
 * Updates or creates the grading configuration for the university.
 */
exports.updateGradingConfig = async (req, res) => {
    try {
        let universityId = req.user.university_id || req.user.college_id;
        const { grade_scale, pass_threshold, calculate_sgpa_on_earned_only, subject_credits, targetUniversityId } = req.body;

        // SuperAdmin can override universityId via body
        const isHighLevel = req.user.role === 'superAdmin' || req.user.role === 'admin';
        if (isHighLevel && targetUniversityId) {
            universityId = targetUniversityId;
        }

        if (!universityId) {
            return res.status(400).json({ message: "University ID not found for user" });
        }

        const result = await db.query(`
            INSERT INTO grading_configs (university_id, grade_scale, pass_threshold, calculate_sgpa_on_earned_only, subject_credits, updated_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (university_id) 
            DO UPDATE SET 
                grade_scale = EXCLUDED.grade_scale,
                pass_threshold = EXCLUDED.pass_threshold,
                calculate_sgpa_on_earned_only = EXCLUDED.calculate_sgpa_on_earned_only,
                subject_credits = EXCLUDED.subject_credits,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [universityId, JSON.stringify(grade_scale), pass_threshold, calculate_sgpa_on_earned_only, JSON.stringify(subject_credits || {})]);

        res.status(200).json({
            message: "Grading configuration updated successfully",
            config: result.rows[0]
        });
    } catch (error) {
        console.error("updateGradingConfig error:", error);
        res.status(500).json({ message: "Failed to update grading configuration" });
    }
};

/**
 * Fetches all subjects for the purpose of credit configuration.
 */
exports.getSubjectsForConfig = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ms.id, ms.subject_code, ms.name, ms.credit, mp.name as program_name, mse.semester_name
            FROM master_subjects ms
            LEFT JOIN master_programs mp ON ms.program_id = mp.id
            LEFT JOIN master_semesters mse ON ms.semester_id = mse.id
            WHERE ms.status = 'Active' OR ms.status IS NULL
            ORDER BY mp.name, mse.semester_name, ms.name
        `);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getSubjectsForConfig error:", error);
        res.status(500).json({ message: "Failed to fetch subjects" });
    }
};
