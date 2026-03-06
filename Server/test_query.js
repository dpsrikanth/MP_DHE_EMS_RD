const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: '172.16.0.225',
  database: 'emsdb',
  password: '!ntense@225'
});

async function run() {
  await client.connect();
  const query = `
    SELECT 
      s.id as student_id,
      TRIM(s.name) as student_name,
      m.id as mark_id,
      m.internal_marks,
      m.exam_id
    FROM students s
    LEFT JOIN marks m ON s.id = m.student_id 
      AND m.subject_id = $4 
      AND (m.exam_id = $5 OR $5 IS NULL)
      AND (m.academic_year_id = $6 OR $6 IS NULL)
    WHERE s."collageName" ILIKE $1 
      AND s."programName" ILIKE $2 
      AND COALESCE(s.semister, '') ILIKE $3 
      AND s."deleteStatus" = true
    ORDER BY s.rollnumber ASC NULLS LAST, s.name ASC
  `;

  const college = '%Mp college%';
  const program = '%BTech%';
  const semester = '%Semester 2%';
  const subject_id = 1;
  const academic_year_id = 1;

  try {
    console.log("--- EXAM ID: 3 (Midterm) ---");
    let res = await client.query(query, [college, program, semester, subject_id, 3, academic_year_id]);
    console.log(res.rows);

    console.log("--- EXAM ID: 4 (Finals) ---");
    let res2 = await client.query(query, [college, program, semester, subject_id, 4, academic_year_id]);
    console.log(res2.rows);
    
    console.log("--- EXAM ID: '' (Empty string, sent from UI) ---");
    let e = "";
    let res3 = await client.query(query, [college, program, semester, subject_id, e || null, academic_year_id]);
    console.log(res3.rows);

  } catch(err) {
    console.error(err);
  } finally {
    client.end();
  }
}

run();
