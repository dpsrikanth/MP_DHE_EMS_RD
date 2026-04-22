const client = require('../../db.js');

async function run() {
    try {
        const res = await client.query(`
      SELECT fs.*, ms.name as subject_name, sem.semester_name, t.user_id, u.name as faculty_name
      FROM faculty_subjects fs
      JOIN master_subjects ms ON fs.subject_id = ms.id
      JOIN master_semesters sem ON fs.semester_id = sem.id
      JOIN teachers t ON fs.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE ms.name ILIKE '%operat%' OR ms.name ILIKE '%system%'
    `);
        console.log("Faculty Subjects:");
        console.table(res.rows);

        if (res.rows.length > 0) {
            const fs = res.rows[0];
            // Let's find program_id. It's in policy_program_subjects maybe? Or we can check columns of fs.
            // Wait, faculty_subjects doesn't have program_id directly?
            const colRes = await client.query('SELECT name FROM colleges WHERE id = $1', [fs.college_id]);
            const semRes = await client.query('SELECT semester_name FROM master_semesters WHERE id = $1', [fs.semester_id]);

            const ppsRes = await client.query(`
        SELECT pps.program_id, mp.name as program_name
        FROM policy_program_subjects pps
        JOIN master_programs mp ON pps.program_id = mp.id
        WHERE pps.subject_id = $1 AND pps.college_id = $2 AND pps.semester_id = $3
      `, [fs.subject_id, fs.college_id, fs.semester_id]);

            console.log("Program mapping:", ppsRes.rows);

            if (ppsRes.rows.length > 0) {
                const collageName = colRes.rows[0].name;
                const programName = ppsRes.rows[0].program_name;
                const semister = semRes.rows[0].semester_name;

                console.log("Querying students for:", collageName, programName, semister);

                const studentsRes = await client.query(`
          SELECT count(*) FROM students 
          WHERE "collageName" = $1 AND "programName" = $2 AND "semister" = $3
        `, [collageName, programName, semister]);

                console.log("Number of students:", studentsRes.rows[0].count);
            }
        } else {
            console.log("No faculty assigned to Operation System section");
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.end();
    }
}

run();
