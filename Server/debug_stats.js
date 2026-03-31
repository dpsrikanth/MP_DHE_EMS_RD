const client = require('./db');
async function check() {
  try {
    const uId = 7;
    // Check university exists
    const u = await client.query("SELECT id, name FROM universities WHERE id = $1", [uId]);
    console.log("University:", u.rows[0] || 'NOT FOUND');

    // Check mapping tables
    const mappings = [
      "SELECT COUNT(*) as c FROM university_master_programs WHERE university_id = $1",
      "SELECT COUNT(*) as c FROM university_master_semesters WHERE university_id = $1",
      "SELECT COUNT(*) as c FROM university_master_academic_years WHERE university_id = $1",
      "SELECT COUNT(*) as c FROM university_master_policies WHERE university_id = $1",
    ];
    const labels = ['programs_mapped', 'semesters_mapped', 'academic_years_mapped', 'policies_mapped'];
    for (let i = 0; i < mappings.length; i++) {
      try {
        const r = await client.query(mappings[i], [uId]);
        console.log(`${labels[i]}: ${r.rows[0].c}`);
      } catch(err) {
        console.error(`${labels[i]} FAILED: ${err.message}`);
      }
    }

    // Check teachers in colleges belonging to university 7
    const teachers = await client.query(`
      SELECT COUNT(*) as c FROM master_teachers mt 
      JOIN colleges c ON mt.college_id = c.id 
      WHERE c.university_id = $1`, [uId]);
    console.log(`teachers in univ ${uId}: ${teachers.rows[0].c}`);

    // List colleges for this university
    const colleges = await client.query("SELECT id, name FROM colleges WHERE university_id = $1", [uId]);
    console.log("Colleges:", colleges.rows);
  } finally {
    client.end();
  }
}
check();
