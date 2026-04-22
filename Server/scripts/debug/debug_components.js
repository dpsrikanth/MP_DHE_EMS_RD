const pool = require('../../db');

async function debugComponents() {
  try {
    const res = await pool.query(`SELECT * FROM internal_marks_structure`);
    console.log("INTERNAL_MARKS_STRUCTURE_DATA:");
    console.log(JSON.stringify(res.rows, null, 2));

    const colleges = await pool.query(`SELECT id, name, college_name FROM colleges`);
    console.log("COLLEGES_DATA:");
    console.log(JSON.stringify(colleges.rows, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debugComponents();
