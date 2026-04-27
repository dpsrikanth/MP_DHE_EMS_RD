const pool = require('../db.js');

async function directClone() {
    try {
        console.log("Fetching Semester 1 (ID 15) milestones for BTech (ID 2)...");
        const sourceRes = await pool.query(
            "SELECT * FROM academic_milestones WHERE semester_id = 15 AND program_id = 2 AND delete_status = true ORDER BY start_date ASC"
        );

        if (sourceRes.rows.length === 0) {
            console.error("No Semester 1 milestones found. Cannot calculate gaps.");
            return;
        }

        const sourceMilestones = sourceRes.rows;
        const sourceAnchorDate = new Date(sourceMilestones[0].start_date); // Commencement of Classes Sem 1
        const targetAnchorDate = new Date('2025-01-15'); // Commencement of Classes Sem 2

        console.log(`Cloning ${sourceMilestones.length} milestones for Semester 2...`);

        for (const ms of sourceMilestones) {
            const startMs = new Date(ms.start_date);
            const endMs = new Date(ms.end_date);

            const startOffset = startMs.getTime() - sourceAnchorDate.getTime();
            const endOffset = endMs.getTime() - sourceAnchorDate.getTime();

            const newStart = new Date(targetAnchorDate.getTime() + startOffset);
            const newEnd = new Date(targetAnchorDate.getTime() + endOffset);

            await pool.query(
                "INSERT INTO academic_milestones (name, start_date, end_date, responsibility, type, description, semester_id, program_id, academic_year_id, college_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
                [ms.name, newStart.toISOString(), newEnd.toISOString(), ms.responsibility, ms.type, ms.description, 16, 2, 1, ms.college_id]
            );
            console.log(`Created: ${ms.name} (${newStart.toISOString().split('T')[0]})`);
        }

        console.log("Semester 2 milestones created successfully.");

    } catch (err) {
        console.error("Error creating milestones:", err);
    } finally {
        pool.end();
    }
}

directClone();

