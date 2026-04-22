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
      m.id as mark_id,
      m.internal_marks,
      m.exam_id
    FROM students s
    LEFT JOIN marks m ON s.id = m.student_id 
      AND m.subject_id = 1 
      AND (m.exam_id = $1 OR $1 IS NULL)
      AND (m.academic_year_id = 9 OR 9 IS NULL)
    WHERE s."collageName" ILIKE '%Mp college%' 
      AND s."programName" ILIKE '%BTech%' 
      AND COALESCE(s.semister, '') ILIKE '%Semester 2%' 
      AND s."deleteStatus" = true
    ORDER BY s.id
  `;

  try {
    console.log("--- EXAM ID: 3 ---");
    let res = await client.query(query, [3]);
    console.log(res.rows);

    console.log("--- EXAM ID: 4 ---");
    let res2 = await client.query(query, [4]);
    console.log(res2.rows);

  } catch(err) {
    console.error(err);
  } finally {
    client.end();
  }
}

run();
