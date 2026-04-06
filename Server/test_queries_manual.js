const db = require('./db');
(async () => {
    try {
        console.log("Query 1:");
        await db.query(`
            SELECT 
                c.id,
                c.name as college_name,
                (
                    SELECT COALESCE(SUM(rows * seats_per_row), 0) 
                    FROM examination_halls 
                    WHERE college_id = c.id AND status = 'Approved'
                ) as approved_capacity,
                (
                    SELECT COUNT(*) 
                    FROM students 
                    WHERE "collageName" ILIKE c.name AND "deleteStatus" = true
                ) as total_students
            FROM colleges c
            ORDER BY c.name ASC
        `);
        console.log("Q1 OK");

        console.log("Query 2:");
        await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM exams) as total_exams,
                (SELECT COUNT(*) FROM students WHERE "deleteStatus" = true) as total_students,
                (SELECT COUNT(*) FROM marks WHERE total_marks >= 40) as total_passed,
                (SELECT COUNT(*) FROM marks WHERE total_marks < 40) as total_failed
        `);
        console.log("Q2 OK");

        console.log("Query 3:");
        await db.query(`
            SELECT 
                c.name as college_name,
                COUNT(m.id) as total_marks_entered,
                SUM(CASE WHEN m.total_marks >= 40 THEN 1 ELSE 0 END) as passed_count,
                ROUND((SUM(CASE WHEN m.total_marks >= 40 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(m.id), 0)) * 100, 2) as pass_percentage
            FROM colleges c
            LEFT JOIN users u ON u.college_id = c.id
            LEFT JOIN students s ON s."collageName" ILIKE c.name
            LEFT JOIN marks m ON m.student_id = s.id
            GROUP BY c.id, c.name
            ORDER BY pass_percentage DESC NULLS LAST
        `);
        console.log("Q3 OK");

        console.log("Query 4: (simulating college 10)");
        await db.query(`
            SELECT 
                fs.id as allocation_id,
                u.name as faculty_name,
                s.name as subject_name,
                p.name as program_name,
                sem.semester_name,
                fs.section,
                COALESCE(mws.status, 'Not Started') as grading_status,
                mws.updated_at as last_updated
            FROM faculty_subjects fs
            JOIN users u ON fs.teacher_id = u.id
            JOIN master_subjects s ON fs.subject_id = s.id
            JOIN master_semesters sem ON fs.semester_id = sem.id
            JOIN master_programs p ON s.program_id = p.id
            LEFT JOIN marks_workflow_status mws ON 
                fs.college_id = mws.college_id AND 
                fs.subject_id = mws.subject_id AND 
                fs.semester_id = mws.semester_id AND 
                fs.section = mws.section
            WHERE fs.college_id = 10
            ORDER BY sem.id, p.name, s.name
        `);
        console.log("Q4 OK");

        console.log("Query 5: (simulating college 10)");
        await db.query(`
            SELECT 
                s.name as subject_name,
                p.name as program_name,
                COUNT(m.id) as total_appeared,
                SUM(CASE WHEN m.total_marks >= 40 THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN m.total_marks < 40 THEN 1 ELSE 0 END) as failed
            FROM marks m
            JOIN students st ON m.student_id = st.id
            JOIN colleges c ON st."collageName" ILIKE c.name
            JOIN master_subjects s ON m.subject_id = s.id
            JOIN master_programs p ON s.program_id = p.id
            WHERE c.id = 10
            GROUP BY s.id, s.name, p.name
            ORDER BY p.name, s.name
        `);
        console.log("Q5 OK");

        process.exit(0);
    } catch(e) {
        console.error("FATAL:", e);
        process.exit(1);
    }
})();
