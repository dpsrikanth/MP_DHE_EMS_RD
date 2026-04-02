const db = require('../db');

// Add a new examination hall (Starts as Draft)
exports.createHall = async (req, res) => {
    try {
        const { hall_code, rows, seats_per_row } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) {
            return res.status(403).json({ error: "Unauthorized: No college assigned" });
        }

        if (!hall_code || !rows || !seats_per_row) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const requested_seats = parseInt(rows) * parseInt(seats_per_row);
        
        const collegeRes = await db.query('SELECT total_rooms FROM colleges WHERE id = $1', [college_id]);
        const max_rooms = collegeRes.rows[0]?.total_rooms || 0;

        if (max_rooms <= 0) {
            return res.status(400).json({ error: "Please configure your Total Campus Rooms limit first before adding examination halls." });
        }

        const roomsRes = await db.query('SELECT COUNT(id) as current_rooms FROM examination_halls WHERE college_id = $1', [college_id]);
        const current_rooms = parseInt(roomsRes.rows[0].current_rooms) || 0;
        
        if (current_rooms >= max_rooms) {
            return res.status(400).json({ error: `Cannot add hall. It exceeds your campus physical limit of ${max_rooms} total rooms.` });
        }

        const query = `
            INSERT INTO examination_halls (hall_code, college_id, rows, seats_per_row, status) 
            VALUES ($1, $2, $3, $4, 'Draft') RETURNING *;
        `;
        const result = await db.query(query, [hall_code, college_id, rows, seats_per_row]);
        res.status(201).json({ message: "Hall added as Draft", data: result.rows[0] });
    } catch (error) {
        console.error("Create hall error:", error);
        if (error.code === '23505') {
            return res.status(400).json({ error: "Hall code already exists for this college" });
        }
        res.status(500).json({ error: "Failed to add examination hall" });
    }
};

// Get all halls for the logged-in college admin
exports.getHalls = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const query = `
            SELECT * FROM examination_halls 
            WHERE college_id = $1 
            ORDER BY created_at DESC;
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get halls error:", error);
        res.status(500).json({ error: "Failed to fetch examination halls" });
    }
};

// Update hall details (Only allowed for Draft or Rejected status)
exports.updateHall = async (req, res) => {
    try {
        const { id } = req.params;
        const { hall_code, rows, seats_per_row } = req.body;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        // Check current status
        const checkQuery = `SELECT status FROM examination_halls WHERE id = $1 AND college_id = $2`;
        const checkResult = await db.query(checkQuery, [id, college_id]);
        if (checkResult.rowCount === 0) return res.status(404).json({ error: "Hall not found" });

        // Enforce room limit check also for updates
        const collegeRes = await db.query('SELECT total_rooms FROM colleges WHERE id = $1', [college_id]);
        const max_rooms = collegeRes.rows[0]?.total_rooms || 0;
        if (max_rooms <= 0) {
            return res.status(400).json({ error: "Please configure your Total Campus Rooms limit first before managing examination halls." });
        }

        const currentStatus = checkResult.rows[0].status;
        if (currentStatus !== 'Draft' && currentStatus !== 'Rejected' && currentStatus !== 'Approved') {
            return res.status(400).json({ error: `Cannot edit hall in ${currentStatus} status` });
        }

        // If editing an approved hall, revert to draft so it requires re-approval
        const newStatus = currentStatus === 'Approved' ? 'Draft' : currentStatus;

        const query = `
            UPDATE examination_halls 
            SET hall_code = $1, rows = $2, seats_per_row = $3, status = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5 AND college_id = $6
            RETURNING *;
        `;
        const result = await db.query(query, [hall_code, rows, seats_per_row, newStatus, id, college_id]);
        res.status(200).json({ message: "Hall updated successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Update hall error:", error);
        res.status(500).json({ error: "Failed to update examination hall" });
    }
};

// Submit hall for Approval (Changes status from Draft/Rejected to Pending)
exports.submitHall = async (req, res) => {
    try {
        const { id } = req.params;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            UPDATE examination_halls 
            SET status = 'Pending', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND college_id = $2 AND (status = 'Draft' OR status = 'Rejected')
            RETURNING *;
        `;
        const result = await db.query(query, [id, college_id]);

        if (result.rowCount === 0) {
            return res.status(400).json({ error: "Hall cannot be submitted. Check status." });
        }

        res.status(200).json({ message: "Hall submitted for approval", data: result.rows[0] });
    } catch (error) {
        console.error("Submit hall error:", error);
        res.status(500).json({ error: "Failed to submit hall" });
    }
};

// Delete a hall (Only allowed if status is Draft or Rejected)
exports.deleteHall = async (req, res) => {
    try {
        const { id } = req.params;
        const college_id = req.user?.college_id;

        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            DELETE FROM examination_halls 
            WHERE id = $1 AND college_id = $2 AND (status = 'Draft' OR status = 'Rejected' OR status = 'Pending')
            RETURNING *;
        `;
        const result = await db.query(query, [id, college_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Hall not found, unauthorized, or already in pending/approved status" });
        }

        res.status(200).json({ message: "Hall deleted successfully" });
    } catch (error) {
        console.error("Delete hall error:", error);
        res.status(500).json({ error: "Failed to delete examination hall" });
    }
};

// --- University Admin / SuperAdmin Approval APIs ---
exports.getAllHallsForApproval = async (req, res) => {
    try {
        const query = `
            SELECT 
                h.*, 
                c.name as college_name,
                (
                    SELECT COUNT(*) 
                    FROM students s 
                    JOIN colleges sc ON s."collageName" ILIKE sc.name 
                    WHERE sc.sitting_center_id = c.id AND s."deleteStatus" = true
                ) + (
                    SELECT COALESCE(SUM(sr1.shortage), 0) 
                    FROM shortage_requests sr1 
                    WHERE sr1.allocated_college_id = c.id AND sr1.status = 'Allocated'
                ) - (
                    SELECT COALESCE(SUM(sr2.shortage), 0) 
                    FROM shortage_requests sr2 
                    WHERE sr2.college_id = c.id AND sr2.status = 'Allocated'
                ) as total_required,
                -- Total capacity already approved for this college
                (
                    SELECT COALESCE(SUM(h2.rows * h2.seats_per_row), 0) 
                    FROM examination_halls h2 
                    WHERE h2.college_id = c.id AND h2.status = 'Approved'
                ) as college_approved_capacity,
                -- Breakdown of guest institutions hosted here
                (
                    SELECT COALESCE(json_agg(json_build_object('name', src.name, 'count', src.count)), '[]'::json)
                    FROM (
                        -- Students mapped here via sitting_center_id, minus any overflow sent elsewhere
                        SELECT 
                            sc.name,
                            GREATEST(0,
                                (SELECT COUNT(*) FROM students s2 
                                 JOIN colleges sc2 ON s2."collageName" ILIKE sc2.name
                                 WHERE sc2.id = sc.id AND s2."deleteStatus" = true)
                                -
                                COALESCE((
                                    SELECT SUM(sr_out.shortage)
                                    FROM shortage_requests sr_out
                                    WHERE sr_out.college_id = sc.id
                                      AND sr_out.allocated_college_id != c.id
                                      AND sr_out.status = 'Allocated'
                                ), 0)
                            ) as count
                        FROM colleges sc
                        WHERE sc.sitting_center_id = c.id
                        UNION ALL
                        -- Overflow students landing here via shortage allocation
                        SELECT cx.name, sr3.shortage as count
                        FROM shortage_requests sr3
                        JOIN colleges cx ON sr3.college_id = cx.id
                        WHERE sr3.allocated_college_id = c.id 
                          AND cx.sitting_center_id != c.id
                          AND sr3.status = 'Allocated'
                    ) src
                    WHERE src.count > 0
                ) as hosting_sources,
                -- Where these college students are assigned (if not here)
                c2.name as assigned_to_center
            FROM examination_halls h
            JOIN colleges c ON h.college_id = c.id
            LEFT JOIN colleges c2 ON c.sitting_center_id = c2.id
            WHERE h.status != 'Draft'
            ORDER BY h.status = 'Pending' DESC, h.created_at DESC;
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get pending halls error:", error);
        res.status(500).json({ error: "Failed to fetch halls for approval" });
    }
};
// These are included here for completeness, though typically they'd be used by a different role or controller.
exports.approveRejectHall = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body; // status should be 'Approved' or 'Rejected'

        if (status !== 'Approved' && status !== 'Rejected') {
            return res.status(400).json({ error: "Invalid status update" });
        }

        const query = `
            UPDATE examination_halls 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *;
        `;
        const result = await db.query(query, [status, id]);

        if (result.rowCount === 0) return res.status(404).json({ error: "Hall not found" });

        res.status(200).json({ message: `Hall ${status} successfully`, data: result.rows[0] });
    } catch (error) {
        console.error("Approve/Reject hall error:", error);
        res.status(500).json({ error: "Failed to update hall status" });
    }
};

// Create a shortage request for additional infrastructure
exports.createShortageRequest = async (req, res) => {
    try {
        const { student_count, available_capacity, shortage } = req.body;
        const college_id = req.user?.college_id;
        
        if (!college_id) {
            return res.status(403).json({ error: "Unauthorized: No college assigned" });
        }

        // Check if a pending request already exists for this college
        const existingQuery = `SELECT id FROM shortage_requests WHERE college_id = $1 AND status = 'Pending'`;
        const existingResult = await db.query(existingQuery, [parseInt(college_id)]);

        let result;
        if (existingResult.rowCount > 0) {
            // Update the existing pending request
            const updateQuery = `
                UPDATE shortage_requests 
                SET student_count = $1, available_capacity = $2, shortage = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id;
            `;
            result = await db.query(updateQuery, [student_count, available_capacity, shortage, existingResult.rows[0].id]);
        } else {
            // Insert a new request
            const insertQuery = `
                INSERT INTO shortage_requests (college_id, student_count, available_capacity, shortage, status)
                VALUES ($1, $2, $3, $4, 'Pending') RETURNING id;
            `;
            result = await db.query(insertQuery, [parseInt(college_id), student_count, available_capacity, shortage]);
        }

        res.status(201).json({ message: "Shortage request sent to university successfully", id: result.rows[0].id });
    } catch (error) {
        console.error("Create shortage request error:", error);
        res.status(500).json({ error: "Failed to send shortage request" });
    }
};

exports.getAllShortageRequests = async (req, res) => {
    try {
        const query = `
            SELECT * FROM (
                SELECT DISTINCT ON (s.college_id)
                    s.id, 
                    s.college_id, 
                    c.name as college_name, 
                    c.latitude,
                    c.longitude,
                    s.status, 
                    s.created_at,
                    -- Total students from ALL colleges that are assigned to THIS college as their sitting center
                    (
                        SELECT COUNT(*) 
                        FROM students st 
                        JOIN colleges sc ON st."collageName" ILIKE sc.name 
                        WHERE sc.sitting_center_id = s.college_id AND st."deleteStatus" = true
                    ) + (
                        SELECT COALESCE(SUM(sr1.shortage), 0) 
                        FROM shortage_requests sr1 
                        WHERE sr1.allocated_college_id = s.college_id AND sr1.status = 'Allocated'
                    ) - (
                        SELECT COALESCE(SUM(sr2.shortage), 0) 
                        FROM shortage_requests sr2 
                        WHERE sr2.college_id = s.college_id AND sr2.status = 'Allocated'
                    ) as student_count,
                    (SELECT COALESCE(SUM(h.rows * h.seats_per_row), 0) FROM examination_halls h WHERE h.college_id = s.college_id AND h.status = 'Approved') as available_capacity,
                    (
                        SELECT COALESCE(json_agg(json_build_object('name', src.name, 'count', src.count)), '[]'::json)
                        FROM (
                            SELECT sc.name, (SELECT COUNT(*) FROM students s2 WHERE s2."collageName" ILIKE sc.name AND s2."deleteStatus" = true) as count
                            FROM colleges sc
                            WHERE sc.sitting_center_id = s.college_id
                            UNION ALL
                            SELECT c.name, sr3.shortage as count
                            FROM shortage_requests sr3
                            JOIN colleges c ON sr3.college_id = c.id
                            WHERE sr3.allocated_college_id = s.college_id AND sr3.status = 'Allocated'
                        ) src
                    ) as hosting_sources,
                    (
                        (
                            SELECT COUNT(*) 
                            FROM students st 
                            JOIN colleges sc ON st."collageName" ILIKE sc.name 
                            WHERE sc.sitting_center_id = s.college_id AND st."deleteStatus" = true
                        ) + (
                            SELECT COALESCE(SUM(sr4.shortage), 0) 
                            FROM shortage_requests sr4 
                            WHERE sr4.allocated_college_id = s.college_id AND sr4.status = 'Allocated'
                        ) - (
                            SELECT COALESCE(SUM(sr5.shortage), 0) 
                            FROM shortage_requests sr5 
                            WHERE sr5.college_id = s.college_id AND sr5.status = 'Allocated'
                        ) - 
                        (SELECT COALESCE(SUM(h.rows * h.seats_per_row), 0) FROM examination_halls h WHERE h.college_id = s.college_id AND h.status = 'Approved')
                    ) as shortage
                FROM shortage_requests s
                JOIN colleges c ON s.college_id = c.id
                WHERE s.status = 'Pending'
                ORDER BY s.college_id, s.created_at DESC
            ) AS live_shortage
            WHERE shortage > 0
            ORDER BY created_at DESC;
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get shortage requests error:", error);
        res.status(500).json({ error: "Failed to fetch shortage requests" });
    }
};

// University Admin: Allocate an external center (Another College)
exports.allocateCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const { allocated_college_id } = req.body;

        if (!allocated_college_id) {
            return res.status(400).json({ error: "Allocated college ID is required" });
        }

        // NEW: Strict Capacity Validation
        const capacityCheck = await db.query(
            `SELECT COALESCE(SUM(rows * seats_per_row), 0) as capacity 
             FROM examination_halls 
             WHERE college_id = $1 AND status = 'Approved'`,
            [allocated_college_id]
        );
        if (parseInt(capacityCheck.rows[0].capacity) === 0) {
            return res.status(400).json({ 
                error: "Selected center has 0 approved seats. Allocation blocked." 
            });
        }

        const query = `
            UPDATE shortage_requests 
            SET allocated_college_id = $1, status = 'Allocated', updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND status = 'Pending'
            RETURNING *;
        `;
        const result = await db.query(query, [allocated_college_id, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Pending shortage request not found" });
        }

        res.status(200).json({ message: "External center allocated successfully", data: result.rows[0] });
    } catch (error) {
        console.error("Allocate center error:", error);
        res.status(500).json({ error: "Failed to allocate center" });
    }
};

// Get the total seating requirement (students from all colleges assigned here)
exports.getSeatingRequirement = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) return res.status(403).json({ error: "Unauthorized" });

        const query = `
            WITH seating_metrics AS (
                SELECT 
                    (
                        SELECT COUNT(*) 
                        FROM students s 
                        JOIN colleges sc ON s."collageName" ILIKE sc.name 
                        WHERE sc.sitting_center_id = $1 AND s."deleteStatus" = true
                    ) as permanent_load,
                    (
                        SELECT COALESCE(SUM(sr1.shortage), 0) 
                        FROM shortage_requests sr1 
                        WHERE sr1.allocated_college_id = $1 AND sr1.status = 'Allocated'
                    ) as shortage_in,
                    (
                        SELECT COALESCE(SUM(sr2.shortage), 0) 
                        FROM shortage_requests sr2 
                        WHERE sr2.college_id = $1 AND sr2.status = 'Allocated'
                    ) as shortage_out
            )
            SELECT 
                (permanent_load + shortage_in - shortage_out) as total_required,
                (
                    SELECT COALESCE(json_agg(json_build_object('name', src.name, 'count', src.count)), '[]'::json)
                    FROM (
                        SELECT sc.name, (SELECT COUNT(*) FROM students s2 WHERE s2."collageName" ILIKE sc.name AND s2."deleteStatus" = true) as count
                        FROM colleges sc
                        WHERE sc.sitting_center_id = $1
                        UNION ALL
                        SELECT c.name, sr3.shortage as count
                        FROM shortage_requests sr3
                        JOIN colleges c ON sr3.college_id = c.id
                        WHERE sr3.allocated_college_id = $1 AND sr3.status = 'Allocated'
                    ) src
                ) as hosting_sources
            FROM seating_metrics;
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Get seating requirement error:", error);
        res.status(500).json({ error: "Failed to fetch seating requirement" });
    }
};

// Get shortage requests for the logged-in college
exports.getCollegeShortage = async (req, res) => {
    try {
        const college_id = req.user?.college_id;
        if (!college_id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const query = `
            SELECT * FROM shortage_requests 
            WHERE college_id = $1 
            ORDER BY created_at DESC;
        `;
        const result = await db.query(query, [college_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Get college shortage error:", error);
        res.status(500).json({ error: "Failed to fetch shortage requests" });
    }
};
