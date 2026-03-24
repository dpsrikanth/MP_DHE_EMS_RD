const pool = require('./db');

async function checkAnilRole() {
  try {
    const res = await pool.query(`
      SELECT r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.name ILIKE '%Anil Kumar%'
    `);
    console.log('--- Anil Kumar Role ---');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

checkAnilRole();
