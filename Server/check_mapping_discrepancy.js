const client = require('./db');

async function checkData() {
  const universityId = 7; // MP UNIVERSITY
  
  console.log("--- Mapped Academic Years (university_master_academic_years) ---");
  const mappedAY = await client.query(
    "SELECT ay.* FROM master_academic_years ay JOIN university_master_academic_years umay ON ay.id = umay.academic_year_id WHERE umay.university_id = $1",
    [universityId]
  );
  console.table(mappedAY.rows.map(r => ({ id: r.id, year_name: r.year_name, univ_id: r.university_id })));

  console.log("\n--- All Academic Years for Univ 7 (Query logic check) ---");
  const allAY = await client.query(
    "SELECT id, year_name, university_id FROM master_academic_years WHERE deleteflag = true AND (university_id = $1 OR EXISTS (SELECT 1 FROM university_master_academic_years umay WHERE umay.academic_year_id = master_academic_years.id AND umay.university_id = $1))",
    [universityId]
  );
  console.table(allAY.rows);

  console.log("\n--- Mapped Semesters (university_master_semesters) ---");
  const mappedSem = await client.query(
    "SELECT s.* FROM master_semesters s JOIN university_master_semesters ums ON s.id = ums.semester_id WHERE ums.university_id = $1",
    [universityId]
  );
  console.table(mappedSem.rows.map(r => ({ id: r.id, semester_name: r.semester_name, semester_number: r.semester_number, univ_id: r.university_id })));

  process.exit();
}

checkData();
