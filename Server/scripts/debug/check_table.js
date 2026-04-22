const db = require('../../db');
async function run() {
    try {
        const college_id = 10;
        const program_id = 2;
        const semester_id = 15;

        // Fetch string names for matching with students table
        const colRes = await db.query('SELECT name FROM colleges WHERE id = $1', [college_id]);
        const progRes = await db.query('SELECT name FROM master_programs WHERE id = $1', [program_id]);
        const semRes = await db.query('SELECT semester_name FROM master_semesters WHERE id = $1', [semester_id]);

        console.log("ColRes:", colRes.rows);
        console.log("ProgRes:", progRes.rows);
        console.log("SemRes:", semRes.rows);

        if (colRes.rowCount === 0 || progRes.rowCount === 0 || semRes.rowCount === 0) {
            console.error("Invalid college, program, or semester ID");
        } else {
            console.log("Valid strings!");
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
