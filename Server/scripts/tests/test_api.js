const pool = require('../../db');

async function testAPI() {
  const userId = 15; // HOD ID 15 from previous debug
  const userRole = 'HOD';

  try {
    let departmentId = null;
    const deptRes = await pool.query('SELECT id FROM master_departments WHERE hod_id = $1', [userId]);
    if (deptRes.rows.length > 0) {
      departmentId = deptRes.rows[0].id;
    } else {
      const teacherRes = await pool.query('SELECT department_id FROM master_teachers WHERE user_id = $1', [userId]);
      if (teacherRes.rows.length > 0) departmentId = teacherRes.rows[0].department_id;
    }

    console.log('Detected Dept ID:', departmentId);

    const subjectsQuery = `
        SELECT DISTINCT s.id, s.subject_code, s.name, s.program_id
        FROM master_subjects s
        JOIN master_subject_departments msd ON s.id = msd.subject_id
        WHERE msd.department_id = $1
        ORDER BY s.name
      `;
    const facultiesQuery = `
        SELECT DISTINCT u.id, u.name, u.email, r.role_name 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN master_teachers mt ON u.id = mt.user_id
        WHERE mt.department_id = $1
        ORDER BY u.name
      `;
    const programsQuery = `
        SELECT DISTINCT p.id, p.name, p.code 
        FROM master_programs p
        JOIN master_program_departments mpd ON p.id = mpd.program_id
        WHERE mpd.department_id = $1
        ORDER BY p.name
      `;

    const [subjects, faculties, programs] = await Promise.all([
      pool.query(subjectsQuery, [departmentId]),
      pool.query(facultiesQuery, [departmentId]),
      pool.query(programsQuery, [departmentId])
    ]);

    console.log('Subjects count:', subjects.rows.length);
    console.log('Faculties count:', faculties.rows.length);
    console.log('Programs count:', programs.rows.length);

    console.log('\n--- Programs ---');
    console.table(programs.rows);
    console.log('\n--- Subjects ---');
    console.table(subjects.rows.slice(0, 5));
    console.log('\n--- Faculties ---');
    console.table(faculties.rows.slice(0, 5));

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

testAPI();
