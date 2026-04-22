const pool = require('../../db');

async function find() {
  try {
    const res = await pool.query("SELECT id, role_name FROM roles WHERE role_name ILIKE '%college_admin%' OR role_name ILIKE '%college admin%'");
    console.log('Roles found:', JSON.stringify(res.rows, null, 2));
    
    const univs = await pool.query("SELECT id, name FROM universities WHERE name ILIKE '%MP UNIVERSITY%'");
    console.log('Universities found:', JSON.stringify(univs.rows, null, 2));

    const colleges = await pool.query("SELECT id, name, university_id FROM colleges WHERE university_id IN (SELECT id FROM universities WHERE name ILIKE '%MP UNIVERSITY%')");
    console.log('Colleges found:', JSON.stringify(colleges.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

find();
