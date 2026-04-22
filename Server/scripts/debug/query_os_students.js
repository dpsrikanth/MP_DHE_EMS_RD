const client = require('../../db.js');

async function run() {
    try {
        const msRes = await client.query(`SELECT id, name FROM master_subjects WHERE name ILIKE '%operat%'`);
        if (msRes.rows.length === 0) {
            console.log("Subject not found");
            return;
        }
        const subjectId = msRes.rows[0].id;

        const ppsRes = await client.query(`
      SELECT pps.*, mp.name as program_name, sem.semester_name, col.name as college_name
      FROM policy_program_subjects pps
      JOIN master_programs mp ON pps.program_id = mp.id
      JOIN master_semesters sem ON pps.semester_id = sem.id
      JOIN colleges col ON pps.college_id = col.id
      WHERE pps.subject_id = $1
    `, [subjectId]);

        let totalEligibleStudents = 0;

        for (const mapping of ppsRes.rows) {
            const studentCountRes = await client.query(`
        SELECT count(*) FROM students 
        WHERE "collageName" = $1 AND "programName" = $2 AND "semister" = $3
      `, [mapping.college_name, mapping.program_name, mapping.semester_name]);

            const count = parseInt(studentCountRes.rows[0].count);
            console.log(`College: ${mapping.college_name}, Program: ${mapping.program_name}, Semester: ${mapping.semester_name} => Students: ${count}`);
            totalEligibleStudents += count;
        }

        console.log(`\nTotal Eligible Students: ${totalEligibleStudents}`);

    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
