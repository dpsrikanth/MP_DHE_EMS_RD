const db = require('../../db');

async function verifyReports() {
    console.log("--- Reporting Data Audit ---");
    try {
        // 1. Global Stats
        const threshold = 40;
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM exams) as exams,
                (SELECT COUNT(*) FROM marks WHERE total_marks >= $1) as passed,
                (SELECT COUNT(*) FROM marks WHERE total_marks < $1) as failed
        `, [threshold]);
        console.log("Global Stats:", stats.rows[0]);

        // 2. Ranking check
        const ranking = await db.query(`
            SELECT c.name, COUNT(m.id) as marks_count
            FROM colleges c
            LEFT JOIN students s ON s."collageName" ILIKE c.name
            LEFT JOIN marks m ON m.student_id = s.id
            GROUP BY c.id, c.name
            LIMIT 5
        `);
        console.log("Ranking Sample:", ranking.rows);

        // 3. College performance for ID 10
        const perf = await db.query(`
            SELECT s.name as subject, COUNT(m.id) as appeared
            FROM marks m
            JOIN students st ON m.student_id = st.id
            JOIN colleges c ON st."collageName" ILIKE c.name
            JOIN master_subjects s ON m.subject_id = s.id
            WHERE c.id = 10
            GROUP BY s.id, s.name
        `);
        console.log("Performance Sample (College 10):", perf.rows);

        process.exit();
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
}

verifyReports();
