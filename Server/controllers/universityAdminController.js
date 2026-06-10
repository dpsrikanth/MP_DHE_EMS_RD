const db = require('../config/db');
const logger = require('../utils/logger');

// --- University Admin APIs (External Faculty Management) ---

exports.getFacultiesForExternal = async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.name, u.email, r.role_name, mt.college_id, c.name as college_name 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN master_teachers mt ON mt.user_id = u.id
            LEFT JOIN colleges c ON mt.college_id = c.id
            WHERE r.role_name = 'External Faculty'
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch external faculties" });
    }
};

exports.getRegistrationsPendingAssignment = async (req, res) => {
    try {
        const { role } = req.user || {};
        const university_id = req.user?.university_id || req.user?.universityId;

        // Fetch Exams that have NO exam-level external faculty assigned yet.
        // Grouped by exam name so assigning once covers the entire series.
        let query = `
            SELECT MIN(e.id) as exam_id, e.name as exam_name,
                   SUM(DISTINCT (SELECT COUNT(DISTINCT er.student_id) FROM exam_registrations er WHERE er.exam_id = e.id AND er.payment_status = 'Paid')) as student_count,
                   COUNT(DISTINCT e.subject_id) as subject_count
            FROM exams e
            LEFT JOIN external_faculty_assignments efa ON (
                efa.exam_id IN (SELECT id FROM exams WHERE name = e.name)
                AND efa.subject_id IS NULL
            )
            WHERE efa.id IS NULL
        `;
        const params = [];

        if (role === 'university_admin') {
            if (!university_id) return res.status(403).json([]);
            query += ` AND e.university_id = $1`;
            params.push(university_id);
        }

        query += ` GROUP BY e.name ORDER BY exam_id DESC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch pending exams" });
    }
};

exports.assignExternalFaculty = async (req, res) => {
    const { faculty_user_id, subject_ids, exam_id } = req.body;
    const assigned_by = req.user.id;

    if (!faculty_user_id || !exam_id) {
        return res.status(400).json({ error: "Faculty ID and Exam ID are required" });
    }

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
            // Subject-level assignments
            for (const subject_id of subject_ids) {
                await client.query(`
                    INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id, assigned_by)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (faculty_user_id, subject_id, exam_id) 
                    DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP
                `, [faculty_user_id, subject_id, exam_id, assigned_by]);
            }
        } else {
            // Exam-level assignment (subject_id IS NULL)
            await client.query(`
                INSERT INTO external_faculty_assignments (faculty_user_id, subject_id, exam_id, assigned_by)
                VALUES ($1, NULL, $2, $3)
                ON CONFLICT (faculty_user_id, COALESCE(subject_id, -1), exam_id) 
                DO UPDATE SET assigned_by = EXCLUDED.assigned_by, assigned_at = CURRENT_TIMESTAMP
            `, [faculty_user_id, exam_id, assigned_by]);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Assignments created successfully" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: "Failed to create assignments" });
    } finally {
        client.release();
    }
};

exports.getExternalAssignments = async (req, res) => {
    try {
        const { role } = req.user || {};
        const university_id = req.user?.university_id || req.user?.universityId;

        let query = `
            SELECT efa.id as assignment_id, efa.status as assignment_status,
                   u.name as faculty_name, e.name as exam_name, 
                   COALESCE(sub.name, 'ALL SUBJECTS') as subject_name,
                   (SELECT COUNT(DISTINCT er.student_id) FROM exam_registrations er WHERE er.exam_id = efa.exam_id AND er.payment_status = 'Paid') as student_count
            FROM external_faculty_assignments efa
            JOIN users u ON efa.faculty_user_id = u.id
            JOIN exams e ON efa.exam_id = e.id
            LEFT JOIN master_subjects sub ON efa.subject_id = sub.id
        `;
        const params = [];

        if (role === 'university_admin') {
            if (!university_id) return res.status(403).json([]);
            query += ` WHERE e.university_id = $1`;
            params.push(university_id);
        }

        query += ` ORDER BY efa.assigned_at DESC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
};

exports.getResultHubData = async (req, res) => {
    try {
        const { exam_id, exam_name, college_id, program_id } = req.query;
        const university_id = req.user?.university_id || req.user?.universityId || null;

        const params = [university_id, exam_name || null];
        const conditions = [];
        let paramIdx = 3; // Start from 3 for additional filters

        // For External Exams (Type 2), require paid registrations. For Internal (Type 1), be more inclusive.
        conditions.push(`(e.exam_type = 1 OR er.payment_status = 'Paid')`);

        // University filter (always $1)
        conditions.push(`($1::integer IS NULL OR e.university_id = $1 OR c.university_id = $1)`);

        if (exam_id) {
            conditions.push(`e.id = $${paramIdx++}`);
            params.push(exam_id);
        }
        if (exam_name) {
            // Exam name filter (always $2)
            conditions.push(`($2::text IS NULL OR TRIM(e.name) ILIKE TRIM($2))`);
        }
        if (college_id) {
            conditions.push(`c.id = $${paramIdx++}`);
            params.push(college_id);
        }
        if (program_id) {
            conditions.push(`e.program_id = $${paramIdx++}`);
            params.push(program_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const query = `
            WITH target_subjects AS (
                SELECT DISTINCT subject_id 
                FROM exams 
                WHERE $2::text IS NOT NULL AND TRIM(name) ILIKE TRIM($2)
                UNION
                SELECT DISTINCT subject_id
                FROM internal_exam_schedules
                WHERE $2::text IS NOT NULL AND TRIM(round_id) ILIKE TRIM($2)
            ),
            ia_ranked AS (
                SELECT 
                    sim_ia.student_id, 
                    sim_ia.subject_id, 
                    sim_ia.marks_obtained::float as marks,
                    ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
                FROM student_internal_marks sim_ia
                JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
                JOIN target_subjects ts ON sim_ia.subject_id = ts.subject_id
                WHERE ims_ia.component_name ILIKE 'IA%'
            ),
            ia_summary AS (
                SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
                FROM ia_ranked ir
                WHERE ir.rnk <= 2
                GROUP BY ir.student_id, ir.subject_id
            ),
            other_summary AS (
                SELECT 
                    sim_o.student_id, 
                    sim_o.subject_id, 
                    SUM(sim_o.marks_obtained::float) as other_total
                FROM student_internal_marks sim_o
                JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
                JOIN target_subjects ts ON sim_o.subject_id = ts.subject_id
                WHERE ims_o.component_name NOT ILIKE 'IA%' 
                  AND ims_o.component_name NOT ILIKE 'TOTAL%'
                  AND ims_o.component_name NOT ILIKE 'BEST_OF_3%'
                GROUP BY sim_o.student_id, sim_o.subject_id
            ),
            raw_internal AS (
                SELECT 
                    COALESCE(i.student_id, o.student_id) as student_id,
                    COALESCE(i.subject_id, o.subject_id) as subject_id,
                    (COALESCE(i.ia_total, 0) + COALESCE(o.total_other, 0)) as total_raw
                FROM ia_summary i
                FULL OUTER JOIN (SELECT student_id, subject_id, other_total as total_other FROM other_summary) o 
                    ON i.student_id = o.student_id AND i.subject_id = o.subject_id
            ),
            marks_base AS (
                SELECT 
                    m.id as mark_id, 
                    s.id as student_id,
                    e.id as exam_id,
                    COALESCE(m.status, 'Not Entered') as marks_status,
                    COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) as internal_marks, 
                    COALESCE(m.external_marks, 0) as external_marks,
                    -- Pass Threshold for calculations
                    COALESCE(gc.pass_threshold, 40) as pass_threshold,
                    -- Policy settings
                    (gc.grace_policy->>'is_enabled')::boolean as is_grace_enabled,
                    (gc.grace_policy->>'max_per_subject_grace')::numeric as max_grace,
                    -- Raw total before grace
                    (COALESCE(cim.total_internal, m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0) + COALESCE(e.moderation_marks, 0)) as raw_total,
                    COALESCE(e.moderation_marks, 0) as moderation_marks,
                    e.moderation_reason,
                    COALESCE(m.grace_marks, 0) as grace_marks,
                    s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s."collageName" as college_name, s."programName" as program_name,
                    e.name as exam_name,
                    e.exam_type,
                    e.results_published,
                    e.program_id,
                    e.semester_id,
                    e.academic_year_id,
                    sub.name as subject_name, sub.id as subject_id,
                    sub.credit as credits,
                    gc.grade_scale
                FROM exams e
                JOIN master_programs mp ON e.program_id = mp.id
                JOIN master_semesters ms ON e.semester_id = ms.id
                JOIN students s ON TRIM(s."programName") ILIKE TRIM(mp.name)
                    AND (
                        (e.exam_type = 1 AND TRIM(s.semister) ILIKE TRIM(ms.semester_name))
                        OR (e.exam_type = 2) 
                    )
                JOIN master_subjects sub ON e.subject_id = sub.id
                LEFT JOIN exam_registrations er ON er.student_id = s.id AND er.exam_id = e.id
                LEFT JOIN colleges c ON TRIM(s."collageName") ILIKE TRIM(c.name)
                LEFT JOIN grading_configs gc ON gc.university_id = COALESCE(e.university_id, c.university_id)
                LEFT JOIN marks_workflow_status mws ON mws.college_id = c.id 
                    AND mws.subject_id = sub.id 
                    AND (mws.section = s.section OR s.section IS NULL OR s.section = '')
                LEFT JOIN marks m ON m.student_id = s.id AND m.exam_id = e.id AND m.subject_id = e.subject_id
                LEFT JOIN calculated_internal_marks cim ON cim.student_id = s.id 
                    AND cim.subject_id = e.subject_id
                    AND cim.college_id = c.id
                LEFT JOIN raw_internal ri ON ri.student_id = s.id AND ri.subject_id = sub.id
                ${whereClause}
                AND (
                    e.exam_type = 2
                    OR mws.status IN ('Locked', 'Approved', 'Finalized', 'Submitted')
                )
            )
            SELECT 
                mb.mark_id, mb.student_id, mb.exam_id, mb.marks_status, 
                mb.internal_marks, mb.external_marks, mb.raw_total, mb.grace_marks,
                mb.moderation_marks, mb.moderation_reason,
                mb.rollnumber, mb.student_name, mb.college_name, mb.program_name,
                mb.exam_name, mb.exam_type, mb.results_published,
                mb.program_id, mb.semester_id, mb.academic_year_id,
                mb.subject_name, mb.subject_id, mb.credits,
                mb.pass_threshold, mb.grade_scale, mb.is_grace_enabled,
                (mb.raw_total + mb.grace_marks) as total_marks,
                CASE 
                    WHEN (mb.raw_total + mb.grace_marks) >= mb.pass_threshold THEN 'Pass'
                    ELSE 'Fail'
                END as result_status
            FROM marks_base mb
            ORDER BY subject_name ASC, mb.rollnumber ASC
        `;
        const result = await db.query(query, params);
        let rows = result.rows;
        const resultsPublished = rows.length > 0 ? rows[0].results_published : false;

        // Fetch total number of subjects in this series to calculate the 1% budget correctly
        let seriesSubjectCount = 5; // Default fallback
        if (exam_name) {
            const seriesInfo = await db.query(
                "SELECT COUNT(DISTINCT subject_id) as count FROM exams WHERE TRIM(name) ILIKE TRIM($1)",
                [exam_name]
            );
            seriesSubjectCount = parseInt(seriesInfo.rows[0].count) || 5;
        }

        // Group by Student for Grace Marks Preview
        const studentGroups = {};
        rows.forEach(r => {
            if (!studentGroups[r.student_id]) studentGroups[r.student_id] = [];
            studentGroups[r.student_id].push(r);
        });

        // Apply Strict Grace Preview per Student
        Object.keys(studentGroups).forEach(stuId => {
            const studentMarks = studentGroups[stuId];
            const passThreshold = Number(studentMarks[0].pass_threshold) || 40;
            const isGraceEnabled = studentMarks[0].is_grace_enabled;
            const maxPerSubject = Number(studentMarks[0].max_grace) || seriesSubjectCount;

            if (isGraceEnabled) {
                const budget = seriesSubjectCount;
                const fails = studentMarks.filter(m => Number(m.raw_total) < passThreshold && Number(m.raw_total) > 0);

                const hasNoInternalFails = fails.every(m => Number(m.internal_marks) > 0);
                const withinFailureLimit = fails.length > 0 && fails.length <= 2;

                let graceApplied = false;

                if (withinFailureLimit && hasNoInternalFails) {
                    let totalNeeded = 0;
                    let withinCaps = true;
                    fails.forEach(m => {
                        const gap = passThreshold - Number(m.raw_total);
                        if (gap > maxPerSubject) withinCaps = false;
                        totalNeeded += gap;
                    });

                    // Strict all-or-nothing grace application
                    if (withinCaps && totalNeeded <= budget) {
                        fails.forEach(m => {
                            m.grace_marks = passThreshold - Number(m.raw_total);
                            m.total_marks = passThreshold;
                            m.result_status = 'Pass';
                        });
                        graceApplied = true;
                    }
                }

                // If grace was NOT applied (disqualified or over budget), 
                // reset any existing grace marks to 0 for preview accuracy
                if (!graceApplied) {
                    studentMarks.forEach(m => {
                        // Only reset if they were originally failing (avoid clearing legitimately passed subjects)
                        if (Number(m.raw_total) < passThreshold) {
                            m.grace_marks = 0;
                            m.total_marks = Number(m.raw_total);
                            m.result_status = 'Fail';
                        }
                    });
                }
            }

            // Calculate Credit Summary per Student for Promotion Logic
            const totalSeriesCredits = studentMarks.reduce((sum, m) => sum + (Number(m.credits) || 0), 0);
            const earnedCredits = studentMarks.reduce((sum, m) => {
                const isPass = Number(m.total_marks) >= passThreshold;
                return isPass ? sum + (Number(m.credits) || 0) : sum;
            }, 0);

            const isEligibleForPromotion = earnedCredits >= (totalSeriesCredits / 2);
            
            studentMarks.forEach(m => {
                m.grace_budget = seriesSubjectCount;
                m.total_series_credits = totalSeriesCredits;
                m.earned_credits = earnedCredits;
                m.promotion_status = isEligibleForPromotion ? 'Promoted' : 'Not Promoted';
            });
        });

        // Calculate Grade and Grade Points for each row based on the scale
        rows = rows.map(row => {
            let grade = 'F';
            let gradePoint = 0;
            // Use the final total_marks (Raw + Grace/Preview)
            const total = Number(row.total_marks);
            const scale = typeof row.grade_scale === 'string' ? JSON.parse(row.grade_scale) : (row.grade_scale || []);

            // Assuming scale is sorted descending by min marks
            const sortedScale = [...scale].sort((a, b) => b.min - a.min);
            for (const s of sortedScale) {
                if (total >= s.min) {
                    grade = s.grade;
                    gradePoint = s.points;
                    break;
                }
            }

            return {
                ...row,
                grade,
                grade_point: gradePoint,
                credit_points: (Number(row.credits) || 0) * gradePoint
            };
        });

        // Compute summary
        const totalStudents = new Set(rows.map(r => r.student_id)).size;
        const totalSubjects = new Set(rows.map(r => r.subject_name)).size;
        const totalWithMarks = rows.filter(r => r.mark_id !== null);
        const passThreshold = rows.length > 0 ? (Number(rows[0].pass_threshold) || 40) : 40;
        const passCount = totalWithMarks.filter(r => Number(r.total_marks) >= passThreshold).length;
        const failCount = totalWithMarks.filter(r => Number(r.total_marks) < passThreshold).length;
        const avgMarks = totalWithMarks.length > 0
            ? (totalWithMarks.reduce((s, r) => s + Number(r.total_marks), 0) / totalWithMarks.length).toFixed(1)
            : '0.0';
        let examType = rows.length > 0 ? rows[0].exam_type : null;
        let isGraceEnabled = rows.length > 0 ? rows[0].is_grace_enabled : false;

        // Check if students are already promoted for this exam series
        let isPromoted = false;
        if (exam_name && rows.length > 0) {
            // Check if there are ANY students who have passed everything but are NOT yet promoted.
            // If such students exist, isPromoted should be false so the admin can click the button.
            const pendingPromotion = await db.query(`
                WITH series_stats AS (
                    SELECT program_id, SUM(credit) as total_credits
                    FROM (
                        SELECT DISTINCT e.program_id, e.subject_id, sub.credit
                        FROM exams e
                        JOIN master_subjects sub ON e.subject_id = sub.id
                        WHERE e.name = $1
                    ) as unique_series_subjects
                    GROUP BY program_id
                ),
                target_subjects AS (
                    SELECT DISTINCT subject_id FROM exams WHERE name = $1
                ),
                ia_ranked AS (
                    SELECT 
                        sim_ia.student_id, 
                        sim_ia.subject_id, 
                        sim_ia.marks_obtained::float as marks,
                        ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
                    FROM student_internal_marks sim_ia
                    JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
                    JOIN target_subjects ts ON sim_ia.subject_id = ts.subject_id
                    WHERE ims_ia.component_name ILIKE 'IA%'
                ),
                ia_summary AS (
                    SELECT student_id, subject_id, SUM(marks) as ia_total
                    FROM ia_ranked
                    WHERE rnk <= 2
                    GROUP BY student_id, subject_id
                ),
                other_summary AS (
                    SELECT 
                        sim_o.student_id, 
                        sim_o.subject_id, 
                        SUM(sim_o.marks_obtained::float) as other_total
                    FROM student_internal_marks sim_o
                    JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
                    JOIN target_subjects ts ON sim_o.subject_id = ts.subject_id
                    WHERE ims_o.component_name NOT ILIKE 'IA%' 
                      AND ims_o.component_name NOT ILIKE 'TOTAL%'
                    GROUP BY sim_o.student_id, sim_o.subject_id
                ),
                raw_internal AS (
                    SELECT COALESCE(i.student_id, o.student_id) as student_id, COALESCE(i.subject_id, o.subject_id) as subject_id,
                           (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw
                    FROM ia_summary i FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
                ),
                student_passed_stats AS (
                    SELECT m.student_id, 
                           e.program_id,
                           SUM(sub.credit) as earned_credits
                    FROM marks m
                    JOIN exams e ON m.exam_id = e.id
                    JOIN master_subjects sub ON e.subject_id = sub.id
                    LEFT JOIN raw_internal ri ON ri.student_id = m.student_id AND ri.subject_id = m.subject_id
                    WHERE e.name = $1
                      AND (COALESCE(m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0) + COALESCE(e.moderation_marks, 0) + COALESCE(m.grace_marks, 0)) >= 40
                    GROUP BY m.student_id, e.program_id
                )
                SELECT 1 FROM students s
                JOIN student_passed_stats sps ON s.id = sps.student_id
                JOIN series_stats ss ON sps.program_id = ss.program_id
                WHERE sps.earned_credits >= (ss.total_credits / 2.0)
                  AND s.semister ~ (
                      SELECT (regexp_matches(ms.semester_name, '\\d+'))[1]
                      FROM exams e
                      JOIN master_semesters ms ON e.semester_id = ms.id
                      WHERE e.name = $1
                      LIMIT 1
                  )
                LIMIT 1
            `, [exam_name]);
            
            // isPromoted is true only if NO eligible students are left in the current semester.
            isPromoted = pendingPromotion.rows.length === 0;
        }

        // Validation for "canPublish" button in UI
        let workflowReady = true;
        if (exam_name) {
            const currentExamType = rows.length > 0 ? rows[0].exam_type : null;

            if (currentExamType === 2) {
                // External Exams (Type 2): Check if external faculty marks are submitted for all subjects in the series
                // Also ensure that internal marks are locked by all relevant colleges if the user expects it.
                const externalCheck = await db.query(`
                    SELECT COUNT(DISTINCT e.subject_id) as total_subjects,
                           COUNT(DISTINCT e.subject_id) FILTER (
                               WHERE efa.status IN ('Submitted', 'Approved', 'Finalized')
                               OR EXISTS (SELECT 1 FROM marks m WHERE m.exam_id = e.id AND m.external_marks IS NOT NULL)
                           ) as submitted_count,
                           -- Also check if internal marks are locked for these subjects across all colleges that have registrations
                           (SELECT COUNT(DISTINCT mws.id) FROM marks_workflow_status mws 
                            WHERE mws.subject_id IN (SELECT subject_id FROM exams WHERE name = $1)
                              AND mws.status NOT IN ('Locked', 'Finalized')
                              AND EXISTS (
                                  SELECT 1 FROM exam_registrations er 
                                  JOIN students s ON er.student_id = s.id
                                  JOIN colleges c ON LOWER(s."collageName") = LOWER(c.name)
                                  WHERE er.exam_id IN (SELECT id FROM exams WHERE name = $1 AND subject_id = mws.subject_id)
                                    AND c.id = mws.college_id
                              )
                           ) as pending_internal_locks
                    FROM exams e
                    LEFT JOIN external_faculty_assignments efa ON (
                        efa.exam_id IN (SELECT id FROM exams WHERE TRIM(name) ILIKE TRIM($1))
                        AND (efa.subject_id = e.subject_id OR efa.subject_id IS NULL)
                    )
                    WHERE TRIM(e.name) ILIKE TRIM($1)
                      -- Only count subjects that actually have registered students
                      AND EXISTS (SELECT 1 FROM exam_registrations er WHERE er.exam_id = e.id AND er.payment_status = 'Paid')
                `, [exam_name]);

                const stats = externalCheck.rows[0];
                const total = parseInt(stats.total_subjects);
                const submitted = parseInt(stats.submitted_count);
                const pendingLocks = parseInt(stats.pending_internal_locks || 0);

                if (total === 0 || submitted < total || pendingLocks > 0) {
                    workflowReady = false;
                }
            } else {
                // Internal Exams (Type 1): Check if all subjects are locked in marks_workflow_status
                const workflowCheck = await db.query(`
                    SELECT COUNT(*) as total, 
                           COUNT(*) FILTER (WHERE mws.status IN ('Locked', 'Finalized')) as locked
                    FROM marks_workflow_status mws
                    JOIN master_subjects sub ON mws.subject_id = sub.id
                    WHERE (mws.college_id = $1 OR $1 IS NULL)
                      AND sub.id IN (
                          SELECT subject_id FROM exams WHERE TRIM(name) ILIKE TRIM($2)
                          UNION
                          SELECT subject_id FROM internal_exam_schedules WHERE TRIM(round_id) ILIKE TRIM($2)
                      )
                `, [college_id || null, exam_name || null]);

                const stats = workflowCheck.rows[0];
                if (parseInt(stats.total) === 0 || parseInt(stats.locked) < parseInt(stats.total)) {
                    workflowReady = false;
                }
            }
        }
        const canPublish = rows.length > 0 && workflowReady;

        res.status(200).json({
            marks: rows,
            summary: {
                totalStudents,
                totalSubjects,
                passCount,
                failCount,
                avgMarks,
                totalRecords: totalWithMarks.length,
                resultsPublished,
                examType,
                canPublish,
                isPromoted,
                isGraceEnabled
            }
        });
    } catch (error) {
        logger.error("getResultHubData failure", { exam_name, college_id, program_id }, error);
        res.status(500).json({
            error: "Failed to fetch result hub data",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getFinalizedExternalMarks = async (req, res) => {
    try {
        const query = `
            WITH marks_base AS (
                SELECT 
                    m.id as mark_id, 
                    er.student_id,
                    er.exam_id,
                    COALESCE(m.status, 'Internal Only') as marks_status,
                    COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) as internal_marks, 
                    COALESCE(m.external_marks, 0) as external_marks,
                    (COALESCE(cim.total_internal, m.internal_marks, raw_internal.total_raw, 0) + COALESCE(m.external_marks, 0)) as total_marks,
                    s.rollnumber, CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s."collageName" as college_name, s."programName" as program_name,
                    e.name as exam_name,
                    sub.name as subject_name, sub.id as subject_id,
                    sub.credit as credits
                FROM exam_registrations er
                JOIN exams e ON er.exam_id = e.id
                JOIN master_subjects sub ON e.subject_id = sub.id
                JOIN students s ON er.student_id = s.id
                LEFT JOIN marks m ON m.student_id = er.student_id AND m.exam_id = er.exam_id AND m.subject_id = e.subject_id
                LEFT JOIN calculated_internal_marks cim ON er.student_id = cim.student_id 
                    AND (cim.subject_id = e.subject_id OR cim.subject_id IN (SELECT id FROM master_subjects WHERE name = sub.name))
                LEFT JOIN (
                    WITH ia_ranked AS (
                        SELECT 
                            sim_ia.student_id, 
                            sim_ia.subject_id, 
                            sim_ia.marks_obtained::float as marks,
                            ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
                        FROM student_internal_marks sim_ia
                        JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
                        WHERE ims_ia.component_name ILIKE 'IA%'
                    ),
                    ia_summary AS (
                        SELECT ir.student_id, ir.subject_id, SUM(ir.marks) as ia_total
                        FROM ia_ranked ir
                        WHERE ir.rnk <= 2
                        GROUP BY ir.student_id, ir.subject_id
                    ),
                    other_summary AS (
                        SELECT 
                            sim_o.student_id, 
                            sim_o.subject_id, 
                            SUM(sim_o.marks_obtained::float) as other_total
                        FROM student_internal_marks sim_o
                        JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
                        WHERE ims_o.component_name NOT ILIKE 'IA%' 
                          AND ims_o.component_name NOT ILIKE 'TOTAL%'
                          AND ims_o.component_name NOT ILIKE 'BEST_OF_3%'
                        GROUP BY sim_o.student_id, sim_o.subject_id
                    )
                    SELECT 
                        COALESCE(i.student_id, o.student_id) as student_id,
                        COALESCE(i.subject_id, o.subject_id) as subject_id,
                        (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw
                    FROM ia_summary i
                    FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
                ) raw_internal ON er.student_id = raw_internal.student_id AND e.subject_id = raw_internal.subject_id
                WHERE er.payment_status = 'Paid'
                  AND (m.status IN ('Pending Approval', 'Approved', 'Draft', 'Internal Only') OR cim.id IS NOT NULL OR raw_internal.total_raw IS NOT NULL)
            ),
            marks_with_grades AS (
                SELECT *,
                    CASE 
                        WHEN total_marks >= 40 THEN 'Pass'
                        ELSE 'Fail'
                    END as result_status,
                    CASE
                        WHEN total_marks >= 90 THEN 'O'
                        WHEN total_marks >= 80 THEN 'A+'
                        WHEN total_marks >= 70 THEN 'A'
                        WHEN total_marks >= 60 THEN 'B+'
                        WHEN total_marks >= 50 THEN 'B'
                        WHEN total_marks >= 40 THEN 'C'
                        ELSE 'F'
                    END as grade,
                    CASE
                        WHEN total_marks >= 90 THEN 10
                        WHEN total_marks >= 80 THEN 9
                        WHEN total_marks >= 70 THEN 8
                        WHEN total_marks >= 60 THEN 7
                        WHEN total_marks >= 50 THEN 6
                        WHEN total_marks >= 40 THEN 5
                        ELSE 0
                    END as grade_point
                FROM marks_base
            )
            SELECT *,
                (credits * grade_point) as credit_points
            FROM marks_with_grades
            ORDER BY subject_name ASC, rollnumber ASC
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("getFinalizedExternalMarks error:", error);
        res.status(500).json({ error: "Failed to fetch synchronized marks" });
    }
};
// University Admin: Get all colleges with their current sitting center mapping
exports.getCollegesMapping = async (req, res) => {
    try {
        const { role } = req.user || {};
        const university_id = req.user?.university_id || req.user?.universityId;

        let query = `
            SELECT 
                c1.id, 
                c1.name as college_name, 
                c1.college_code,
                c1.sitting_center_id,
                c2.name as sitting_center_name,
                (
                SELECT COUNT(*) 
                FROM students st 
                JOIN colleges sc ON st."collageName" ILIKE sc.name 
                WHERE sc.sitting_center_id = c1.id AND st."deleteStatus" = true
            ) + (
                SELECT COALESCE(SUM(sr1.shortage), 0) 
                FROM shortage_requests sr1 
                WHERE sr1.allocated_college_id = c1.id AND sr1.status = 'Allocated'
            ) - (
                SELECT COALESCE(SUM(sr2.shortage), 0) 
                FROM shortage_requests sr2 
                WHERE sr2.college_id = c1.id AND sr2.status = 'Allocated'
            ) as student_count,
                (SELECT COALESCE(SUM(h.rows * h.seats_per_row), 0) FROM examination_halls h WHERE h.college_id = c1.id AND h.status = 'Approved') as internal_capacity,
                -- Total students from ALL colleges assigned to THIS college as their center
                (
                    SELECT COUNT(*) 
                    FROM students s 
                    JOIN colleges sc ON s."collageName" ILIKE sc.name 
                    WHERE sc.sitting_center_id = c1.id AND s."deleteStatus" = true
                ) + (
                    SELECT COALESCE(SUM(sr3.shortage), 0) 
                    FROM shortage_requests sr3 
                    WHERE sr3.allocated_college_id = c1.id AND sr3.status = 'Allocated'
                ) - (
                    SELECT COALESCE(SUM(sr4.shortage) , 0)
                    FROM shortage_requests sr4
                    WHERE sr4.college_id = c1.id AND sr4.status = 'Allocated'
                ) as total_assigned_students
            FROM colleges c1
            LEFT JOIN colleges c2 ON c1.sitting_center_id = c2.id
            WHERE 1=1
        `;
        const params = [];

        if (role === 'university_admin') {
            if (!university_id) return res.status(200).json([]);
            query += ` AND c1.university_id = $1`;
            params.push(university_id);
        }

        query += ` ORDER BY c1.name ASC;`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get colleges mapping error:", error);
        res.status(500).json({ error: "Failed to fetch college mappings" });
    }
};

// University Admin: Update sitting center for a college
exports.updateSittingCenter = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { sitting_center_id } = req.body;

        if (sitting_center_id) {
            // --- Step 1: Check center has approved halls ---
            const capacityRes = await db.query(
                `SELECT COALESCE(SUM(rows * seats_per_row), 0) AS total_capacity
                 FROM examination_halls
                 WHERE college_id = $1 AND status = 'Approved'`,
                [sitting_center_id]
            );
            const totalCapacity = parseInt(capacityRes.rows[0].total_capacity);

            if (totalCapacity === 0) {
                return res.status(400).json({
                    error: `Target center has 0 approved seats. Please create and get halls approved for this college first.`
                });
            }

            // --- Step 2: Calculate already-committed seats at this center ---
            // Students from other colleges globally mapped here (sitting_center_id = this center)
            // EXCLUDING the college being re-mapped (collegeId) to avoid double-counting
            const committedRes = await db.query(
                `SELECT 
                    -- Students from colleges permanently mapped to this center
                    COALESCE((
                        SELECT COUNT(*) 
                        FROM students s
                        JOIN colleges gc ON gc.name ILIKE s."collageName"
                        WHERE gc.sitting_center_id = $1
                          AND gc.id != $2
                          AND s."deleteStatus" = true
                    ), 0)
                    +
                    -- Students assigned here via shortage allocation
                    COALESCE((
                        SELECT SUM(sr.shortage) 
                        FROM shortage_requests sr
                        WHERE sr.allocated_college_id = $1 AND sr.status = 'Allocated'
                    ), 0)
                 AS committed_seats`,
                [sitting_center_id, collegeId]
            );
            const committedSeats = parseInt(committedRes.rows[0].committed_seats);
            const availableSeats = totalCapacity - committedSeats;

            // --- Step 3: Get source college's student count ---
            const studentRes = await db.query(
                `SELECT COUNT(*) AS student_count
                 FROM students s
                 JOIN colleges c ON c.name ILIKE s."collageName"
                 WHERE c.id = $1 AND s."deleteStatus" = true`,
                [collegeId]
            );
            const studentCount = parseInt(studentRes.rows[0].student_count);

            // --- Step 4: Hard Block if students don't fit ---
            if (availableSeats <= 0 || studentCount > availableSeats) {
                const centerRes = await db.query(`SELECT name FROM colleges WHERE id = $1`, [sitting_center_id]);
                const centerName = centerRes.rows[0]?.name || 'Target Center';

                const reason = availableSeats <= 0
                    ? `${centerName} is already overcommitted (Total: ${totalCapacity} seats, Already committed: ${committedSeats} students — over capacity by ${Math.abs(availableSeats)}).`
                    : `${centerName} only has ${availableSeats} available seat(s), but ${studentCount} students need to be seated.`;

                return res.status(400).json({
                    error: `Cannot map: ${reason} Please choose a center with more capacity or add more approved halls.`
                });
            }
        }

        // --- All checks passed: do the update ---
        const result = await db.query(
            `UPDATE colleges 
             SET sitting_center_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [sitting_center_id || null, collegeId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "College not found" });
        }

        res.status(200).json({ message: "Sitting center updated successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Update sitting center error:", error);
        res.status(500).json({ error: "Failed to update sitting center" });
    }
};

// University Admin: Get students of a specific college for center allocation
exports.getStudentsForAllocation = async (req, res) => {
    try {
        const { collegeId } = req.params;
        const { exam_id } = req.query;

        let examFilter = "";
        let params = [collegeId];
        let pCount = 1;

        const examIdNum = parseInt(exam_id);
        if (examIdNum && !isNaN(examIdNum)) {
            const examRes = await db.query(`
                SELECT e.name as exam_name, mp.name as program_name, ms.semester_name 
                FROM exams e
                LEFT JOIN master_programs mp ON e.program_id = mp.id
                LEFT JOIN master_semesters ms ON e.semester_id = ms.id
                WHERE e.id = $1
            `, [examIdNum]);
            
            if (examRes.rowCount > 0) {
                const { program_name, semester_name, exam_name } = examRes.rows[0];
                console.log(`[DEBUG] Exam scope: Exam="${exam_name}", Program="${program_name}", Semester="${semester_name}"`);
                
                // Use aggressive normalization to handle legacy naming inconsistencies
                if (program_name) {
                    pCount++;
                    // Strip all non-alphanumeric characters and convert to lowercase
                    examFilter += ` AND LOWER(REGEXP_REPLACE(s."programName", '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE($${pCount}, '[^a-zA-Z0-9]', '', 'g'))`;
                    params.push(program_name);
                }
                if (semester_name) {
                    pCount++;
                    // Strip all non-alphanumeric, and normalize "semister" -> "semester"
                    examFilter += ` AND LOWER(REGEXP_REPLACE(REPLACE(LOWER(s."semister"), 'semister', 'semester'), '[^a-zA-Z0-9]', '', 'g')) = LOWER(REGEXP_REPLACE(REPLACE(LOWER($${pCount}), 'semister', 'semester'), '[^a-zA-Z0-9]', '', 'g'))`;
                    params.push(semester_name);
                }
            } else {
                console.warn(`[DEBUG] Exam ID ${exam_id} not found in database!`);
            }
        }

        console.log(`[DEBUG] Main query params:`, params);
        console.log(`[DEBUG] examFilter: "${examFilter}"`);

        let query = `
            SELECT DISTINCT s.id, s.name, s.rollnumber, s."programName", s.semister, 
                   s.sitting_center_id,
                   c_personal.name as sitting_center_name,
                   c_seated.name as actual_seated_center_name,
                   hc_center.name as college_center_name,
                   sa.hall_code,
                   sa.row_no,
                   sa.seat_no
            FROM students s
            JOIN colleges hc ON hc.name ILIKE s."collageName"
            LEFT JOIN exam_registrations er ON er.student_id = s.id ${exam_id ? 'AND er.exam_id = ' + parseInt(exam_id) : ''}
            LEFT JOIN colleges c_personal ON s.sitting_center_id = c_personal.id
            LEFT JOIN colleges hc_center ON hc.sitting_center_id = hc_center.id
            LEFT JOIN (
                SELECT sa_inner.student_id, sa_inner.exam_id,
                       h.hall_code, sa_inner.row_no, sa_inner.seat_no,
                       sa_inner.college_id as seated_college_id
                FROM seating_arrangements sa_inner
                JOIN examination_halls h ON sa_inner.hall_id = h.id
                ${exam_id ? 'WHERE sa_inner.exam_id = ' + parseInt(exam_id) : ''}
            ) sa ON sa.student_id = s.id
            LEFT JOIN colleges c_seated ON c_seated.id = sa.seated_college_id
            WHERE hc.id = $1 AND s."deleteStatus" = true ${examFilter}
        `;


        query += ` ORDER BY s.rollnumber ASC`;

        const result = await db.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get students for allocation error:", error);
        res.status(500).json({ error: "Failed to fetch students" });
    }
};

// University Admin: Allocate specific students to an external sitting center
exports.allocateStudentsToCenter = async (req, res) => {
    try {
        const { studentIds, targetCenterId } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: "No students selected for allocation" });
        }

        const query = `
            UPDATE students
            SET sitting_center_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = ANY($2::int[])
            RETURNING id
        `;
        const result = await db.query(query, [targetCenterId || null, studentIds]);

        res.status(200).json({
            message: "Student centers allocated successfully",
            allocated_count: result.rowCount
        });
    } catch (error) {
        console.error("Allocate students center error:", error);
        res.status(500).json({ error: "Failed to allocate student centers" });
    }
};

exports.getStudentSearchDetails = async (req, res) => {
    try {
        const { admissionNo } = req.params;

        if (!admissionNo) {
            return res.status(400).json({ error: "Admission number is required" });
        }

        // 1. Fetch Student Personal Details
        const studentRes = await db.query(`
            SELECT s.*, c.name as college_name
            FROM students s
            LEFT JOIN colleges c ON s."collageName" ILIKE c.name
            WHERE s.admission_no = $1 AND s."deleteStatus" = true
        `, [admissionNo]);

        if (studentRes.rows.length === 0) {
            return res.status(404).json({ error: "Student not found" });
        }

        const student = studentRes.rows[0];

        // Initialize response object
        const response = {
            personalDetails: student,
            marksHistory: [],
            paymentHistory: [],
            centerHistory: []
        };

        // 2. Fetch Marks History (Safe wrapper)
        try {
            const marksRes = await db.query(`
                WITH target_subjects AS (
                    SELECT DISTINCT subject_id FROM exams 
                ),
                ia_ranked AS (
                    SELECT 
                        sim_ia.student_id, 
                        sim_ia.subject_id, 
                        sim_ia.marks_obtained::float as marks,
                        ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
                    FROM student_internal_marks sim_ia
                    JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
                    WHERE ims_ia.component_name ILIKE 'IA%'
                ),
                ia_summary AS (
                    SELECT student_id, subject_id, SUM(marks) as ia_total
                    FROM ia_ranked
                    WHERE rnk <= 2
                    GROUP BY student_id, subject_id
                ),
                other_summary AS (
                    SELECT 
                        sim_o.student_id, 
                        sim_o.subject_id, 
                        SUM(sim_o.marks_obtained::float) as other_total
                    FROM student_internal_marks sim_o
                    JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
                    WHERE ims_o.component_name NOT ILIKE 'IA%' 
                      AND ims_o.component_name NOT ILIKE 'TOTAL%'
                    GROUP BY sim_o.student_id, sim_o.subject_id
                ),
                raw_internal AS (
                    SELECT COALESCE(i.student_id, o.student_id) as student_id, COALESCE(i.subject_id, o.subject_id) as subject_id,
                           (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw
                    FROM ia_summary i FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
                )
                SELECT m.*, 
                       COALESCE(m.internal_marks, ri.total_raw, 0) as internal_marks,
                       (COALESCE(m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0) + COALESCE(e.moderation_marks, 0) + COALESCE(m.grace_marks, 0)) as total_marks,
                       sub.name as subject_name, sub.subject_code, sub.credit,
                       sem.semester_name, 
                       ay.year_name as academic_year,
                       e.name as exam_name
                FROM marks m
                JOIN master_subjects sub ON m.subject_id = sub.id
                JOIN master_semesters sem ON sub.semester_id = sem.id
                LEFT JOIN master_academic_years ay ON m.academic_year_id = ay.id
                JOIN exams e ON m.exam_id = e.id
                LEFT JOIN raw_internal ri ON m.student_id = ri.student_id AND m.subject_id = ri.subject_id
                WHERE m.student_id = $1
                ORDER BY ay.year_name DESC, sem.id DESC, sub.name ASC
            `, [student.id]);
            response.marksHistory = marksRes.rows;
        } catch (e) { console.error("Marks fetch error:", e.message); }

        // 3. Fetch Payment History (Safe wrapper - might fail if table not migrated)
        try {
            const paymentsRes = await db.query(`
                SELECT p.*, sem.semester_name, ay.year_name as academic_year
                FROM student_semester_payments p
                JOIN master_semesters sem ON p.semester_id = sem.id
                JOIN master_academic_years ay ON p.academic_year_id = ay.id
                WHERE p.student_id = $1
                ORDER BY ay.year_name DESC, sem.id DESC
            `, [student.id]);
            response.paymentHistory = paymentsRes.rows;
        } catch (e) { console.error("Payments fetch error (Table might be missing):", e.message); }

        // 4. Fetch Center History (Safe wrapper)
        try {
            const centerRes = await db.query(`
                SELECT sa.*, e.name as exam_name, e.exam_date,
                       c.name as center_name,
                       eh.hall_code
                FROM seating_arrangements sa
                JOIN exams e ON sa.exam_id = e.id
                JOIN colleges c ON sa.college_id = c.id
                JOIN examination_halls eh ON sa.hall_id = eh.id
                WHERE sa.student_id = $1
                ORDER BY e.exam_date DESC
            `, [student.id]);
            response.centerHistory = centerRes.rows;
        } catch (e) { console.error("Center history fetch error:", e.message); }

        res.status(200).json(response);

    } catch (error) {
        console.error("Get student search details error:", error);
        res.status(500).json({ error: "Failed to fetch student profile" });
    }
};
// University Admin: Update moderation marks for an exam/subject paper
exports.updateModerationMarks = async (req, res) => {
    try {
        const { exam_id, moderation_marks, moderation_reason } = req.body;
        const user_id = req.user?.id;

        if (!exam_id) {
            return res.status(400).json({ error: "Exam ID is required" });
        }

        const query = `
            UPDATE exams 
            SET moderation_marks = $1, 
                moderation_reason = $2,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $3
            WHERE id = $4
            RETURNING *
        `;
        const result = await db.query(query, [moderation_marks || 0, moderation_reason || null, user_id, exam_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Exam paper not found" });
        }

        // Log action
        await db.query(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
            VALUES ($1, $2, $3, $4, $5)
        `, [user_id, 'UPDATE_MODERATION', 'exams', exam_id, JSON.stringify({ moderation_marks, moderation_reason })]);

        res.status(200).json({ 
            message: "Moderation marks updated successfully", 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error("Update moderation marks error:", error);
        res.status(500).json({ error: "Failed to update moderation marks" });
    }
};

// University Admin: Promote students who passed all subjects in an exam series
exports.promoteStudents = async (req, res) => {
    const { exam_name } = req.body;
    if (!exam_name) return res.status(400).json({ error: "Exam name is required" });

    try {
        // 1. Get Exam Semester context
        const examInfo = await db.query(`
            SELECT DISTINCT ms.semester_name 
            FROM exams e 
            JOIN master_semesters ms ON e.semester_id = ms.id 
            WHERE e.name = $1
        `, [exam_name]);
        
        if (examInfo.rows.length === 0) {
            return res.status(404).json({ error: "Exam series not found" });
        }
        const examSem = examInfo.rows[0].semester_name;

        const query = `
            WITH series_stats AS (
                SELECT program_id, SUM(credit) as total_credits
                FROM (
                    SELECT DISTINCT e.program_id, e.subject_id, sub.credit
                    FROM exams e
                    JOIN master_subjects sub ON e.subject_id = sub.id
                    WHERE e.name = $1
                ) as unique_series_subjects
                GROUP BY program_id
            ),
            target_subjects AS (
                SELECT DISTINCT subject_id FROM exams WHERE name = $1
            ),
            ia_ranked AS (
                SELECT 
                    sim_ia.student_id, 
                    sim_ia.subject_id, 
                    sim_ia.marks_obtained::float as marks,
                    ROW_NUMBER() OVER (PARTITION BY sim_ia.student_id, sim_ia.subject_id ORDER BY sim_ia.marks_obtained::float DESC) as rnk
                FROM student_internal_marks sim_ia
                JOIN internal_marks_structure ims_ia ON sim_ia.component_id = ims_ia.id
                JOIN target_subjects ts ON sim_ia.subject_id = ts.subject_id
                WHERE ims_ia.component_name ILIKE 'IA%'
            ),
            ia_summary AS (
                SELECT student_id, subject_id, SUM(marks) as ia_total
                FROM ia_ranked
                WHERE rnk <= 2
                GROUP BY student_id, subject_id
            ),
            other_summary AS (
                SELECT 
                    sim_o.student_id, 
                    sim_o.subject_id, 
                    SUM(sim_o.marks_obtained::float) as other_total
                FROM student_internal_marks sim_o
                JOIN internal_marks_structure ims_o ON sim_o.component_id = ims_o.id
                JOIN target_subjects ts ON sim_o.subject_id = ts.subject_id
                WHERE ims_o.component_name NOT ILIKE 'IA%' 
                  AND ims_o.component_name NOT ILIKE 'TOTAL%'
                GROUP BY sim_o.student_id, sim_o.subject_id
            ),
            raw_internal AS (
                SELECT COALESCE(i.student_id, o.student_id) as student_id, COALESCE(i.subject_id, o.subject_id) as subject_id,
                       (COALESCE(i.ia_total, 0) + COALESCE(o.other_total, 0)) as total_raw
                FROM ia_summary i FULL OUTER JOIN other_summary o ON i.student_id = o.student_id AND i.subject_id = o.subject_id
            ),
            student_passed_stats AS (
                SELECT m.student_id, 
                       e.program_id,
                       SUM(sub.credit) as earned_credits
                FROM marks m
                JOIN students s ON m.student_id = s.id
                JOIN exams e ON m.exam_id = e.id
                JOIN master_subjects sub ON e.subject_id = sub.id
                LEFT JOIN raw_internal ri ON ri.student_id = m.student_id AND ri.subject_id = m.subject_id
                LEFT JOIN colleges c ON TRIM(s."collageName") ILIKE TRIM(c.name)
                LEFT JOIN grading_configs gc ON gc.university_id = COALESCE(e.university_id, c.university_id)
                WHERE e.name = $1
                  AND (COALESCE(m.internal_marks, ri.total_raw, 0) + COALESCE(m.external_marks, 0) + COALESCE(e.moderation_marks, 0) + COALESCE(m.grace_marks, 0)) >= COALESCE(gc.pass_threshold, 40)
                GROUP BY m.student_id, e.program_id
            )
            SELECT DISTINCT s.id, s.semister, s.name
            FROM students s
            JOIN student_passed_stats sps ON s.id = sps.student_id
            JOIN series_stats ss ON sps.program_id = ss.program_id
            WHERE sps.earned_credits >= (ss.total_credits / 2.0)
              AND s.semister ~ (SELECT (regexp_matches($2, '\\d+'))[1])
        `;
        const result = await db.query(query, [exam_name, examSem]);
        const studentsToPromote = result.rows;

        if (studentsToPromote.length === 0) {
            return res.status(200).json({ message: "No eligible students found for promotion. Either they failed some subjects or they are already promoted." });
        }

        // 3. Perform promotion (Increment semester number: SEM-1 -> SEM-2)
        let promotedCount = 0;
        for (const student of studentsToPromote) {
            const nextSem = student.semister.replace(/(\d+)/, (match, n) => parseInt(n) + 1);
            if (nextSem !== student.semister) {
                await db.query(`UPDATE students SET semister = $1 WHERE id = $2`, [nextSem, student.id]);
                promotedCount++;
            }
        }

        res.status(200).json({ 
            message: `Successfully promoted ${promotedCount} students to the next semester.`,
            promotedCount 
        });
    } catch (error) {
        console.error("Promote students error:", error);
        res.status(500).json({ error: "An error occurred during student promotion." });
    }
};

// University Admin: Revert promotion (decrement semester number) - For testing
exports.unpromoteStudents = async (req, res) => {
    const { exam_name } = req.body;
    if (!exam_name) return res.status(400).json({ error: "Exam name is required" });

    try {
        // Find students who were part of this exam series
        const query = `
            SELECT DISTINCT s.id, s.semister
            FROM students s
            JOIN marks m ON s.id = m.student_id
            JOIN exams e ON m.exam_id = e.id
            WHERE e.name = $1
        `;
        const result = await db.query(query, [exam_name]);
        
        let unpromotedCount = 0;
        for (const student of result.rows) {
            const prevSem = student.semister.replace(/(\d+)/, (match, n) => Math.max(1, parseInt(n) - 1));
            if (prevSem !== student.semister) {
                await db.query(`UPDATE students SET semister = $1 WHERE id = $2`, [prevSem, student.id]);
                unpromotedCount++;
            }
        }

        res.status(200).json({ 
            message: `Reverted promotion for ${unpromotedCount} students.`,
            unpromotedCount 
        });
    } catch (error) {
        console.error("Unpromote students error:", error);
        res.status(500).json({ error: "An error occurred during unpromotion." });
    }
};
