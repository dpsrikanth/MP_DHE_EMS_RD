const client = require('./db');

async function check() {
    try {
        console.log("--- Grouping Exams by Name and Semester ---");
        const res = await client.query(`
            SELECT name, academic_year_id, semester_id, COUNT(id) as exam_count, ARRAY_AGG(id) as exam_ids
            FROM exams
            GROUP BY name, academic_year_id, semester_id
            HAVING COUNT(id) > 1
            LIMIT 10
        `);
        console.table(res.rows);

        if (res.rows.length > 0) {
            const firstGroup = res.rows[0];
            console.log(`\n--- Subjects in group: ${firstGroup.name} ---`);
            const subRes = await client.query(`
                SELECT e.id as exam_id, s.name as subject_name
                FROM exams e
                JOIN master_subjects s ON e.subject_id = s.id
                WHERE e.id = ANY($1)
            `, [firstGroup.exam_ids]);
            console.table(subRes.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
