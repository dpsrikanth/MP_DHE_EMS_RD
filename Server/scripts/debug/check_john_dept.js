const pool = require('../../db');

async function checkJohnDept() {
  const johnId = 18;
  try {
    const res = await pool.query('SELECT user_id, department_id FROM master_teachers WHERE user_id = $1', [johnId]);
    console.log(`--- John (ID: ${johnId}) in master_teachers ---`);
    console.table(res.rows);

    const roles = await pool.query('SELECT r.role_name FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = $1', [johnId]);
    console.log(`--- John Role ---`);
    console.table(roles.rows);

  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkJohnDept();
