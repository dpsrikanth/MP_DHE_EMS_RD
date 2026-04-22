const pool = require('../../db');

async function checkDept68() {
  try {
    const res = await pool.query(`
      SELECT u.id, u.name, u.email, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN master_teachers mt ON u.id = mt.user_id
      WHERE mt.department_id = 68
    `);
    console.log('--- Teachers in Dept 68 ---');
    console.table(res.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkDept68();
