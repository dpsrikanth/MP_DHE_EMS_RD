const pool = require('../db.js');

async function debug() {
    try {
        const milestones = await pool.query('SELECT academic_year_id FROM academic_milestones WHERE academic_year_id IS NOT NULL');
        console.log("Existing Academic Year IDs in milestones:", milestones.rows);

        const masterAY = await pool.query('SELECT id, year_name FROM master_academic_years');
        console.log("IDs in master_academic_years:", masterAY.rows);

        const res = await pool.query("SELECT academic_year_id FROM academic_milestones LIMIT 1");
        if(res.rows.length > 0) {
           console.log("Type of academic_year_id in milestones:", typeof res.rows[0].academic_year_id);
        }

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

debug();

