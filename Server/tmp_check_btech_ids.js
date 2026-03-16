const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225',
  port: 5432,
});

async function check() {
    try {
        console.log("--- Program ID for BTech ---");
        const prog = await pool.query("SELECT id, name FROM master_programs WHERE name ILIKE '%BTech%' OR name ILIKE '%B.Tech%'");
        console.table(prog.rows);

        console.log("\n--- Semester ID for Semester 1 ---");
        const sem = await pool.query("SELECT id, semester_name FROM master_semesters WHERE semester_name ILIKE '%1%'");
        console.table(sem.rows);

        console.log("\n--- Active Colleges ---");
        const colleges = await pool.query("SELECT id, name, status FROM colleges");
        console.table(colleges.rows);
        console.log(`Found ${colleges.rows.length} colleges.`);

        const btechId = 2;
        const sem1Id = 15;

        if (btechId && sem1Id) {
            console.log(`\n--- Subjects for BTech (ID:${btechId}) Semester 1 (ID:${sem1Id}) ---`);
            const subjects = await pool.query(`
                SELECT ms.id, ms.name 
                FROM master_subjects ms
                WHERE ms.program_id = $1 AND ms.semester_id = $2
                UNION
                SELECT msm.subject_id, ms.name
                FROM master_subject_mappings msm
                JOIN master_subjects ms ON msm.subject_id = ms.id
                WHERE msm.program_id = $1 AND msm.semester_id = $2
            `, [btechId, sem1Id]);
            console.table(subjects.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}
check();
