const pool = require('../../db');

async function debugHOD() {
  try {
    // 1. Check all HODs
    const hods = await pool.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.role_name = 'HOD'
    `);
    console.log('--- HOD Users ---');
    console.table(hods.rows);

    for (const hod of hods.rows) {
      console.log(`\nChecking HOD: ${hod.name} (ID: ${hod.id})`);
      
      // Check master_departments
      const dept = await pool.query('SELECT id, department_name FROM master_departments WHERE hod_id = $1', [hod.id]);
      console.log('In master_departments:', dept.rows);

      // Check master_teachers
      const teacher = await pool.query('SELECT department_id FROM master_teachers WHERE user_id = $1', [hod.id]);
      console.log('In master_teachers (dept_id):', teacher.rows);

      const deptId = dept.rows[0]?.id || teacher.rows[0]?.department_id;
      if (deptId) {
        // Check mappings
        const pCount = await pool.query('SELECT count(*) FROM master_program_departments WHERE department_id = $1', [deptId]);
        const sCount = await pool.query('SELECT count(*) FROM master_subject_departments WHERE department_id = $1', [deptId]);
        console.log(`Mappings - Programs: ${pCount.rows[0].count}, Subjects: ${sCount.rows[0].count}`);
      } else {
        console.log('No department found for this HOD.');
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

debugHOD();
