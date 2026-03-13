const pool = require('./db');

async function debugAll() {
  try {
    console.log("--- Internal Marks Structure (IMS) ---");
    const ims = await pool.query(`SELECT id, college_id, department_id, program_id, semester_id, subject_id, component_name FROM internal_marks_structure`);
    console.table(ims.rows);

    console.log("\n--- Master Programs ---");
    const programs = await pool.query(`SELECT id, name FROM master_programs`);
    console.table(programs.rows);

    console.log("\n--- Master Semesters ---");
    const semesters = await pool.query(`SELECT id, semester_name FROM master_semesters`);
    console.table(semesters.rows);

    console.log("\n--- Master Subjects (Full) ---");
    const subjects = await pool.query(`SELECT * FROM master_subjects`);
    console.table(subjects.rows);

    console.log("\n--- Master Subject Mappings (Full) ---");
    const mappings = await pool.query(`SELECT * FROM master_subject_mappings`);
    console.table(mappings.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

debugAll();
