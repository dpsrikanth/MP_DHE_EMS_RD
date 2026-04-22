const db = require('../../db');

async function checkData() {
    try {
        const years = await db.query("SELECT * FROM master_academic_years");
        console.log("Master Academic Years count:", years.rowCount);
        console.log("Years data:", years.rows);

        const progs = await db.query("SELECT * FROM master_programs LIMIT 5");
        console.log("Master Programs count:", progs.rowCount);
        console.log("Programs data:", progs.rows);

        const legacyProgs = await db.query("SELECT * FROM programs LIMIT 5");
        console.log("Legacy Programs count:", legacyProgs.rowCount);

        const marksProps = await db.query("SELECT DISTINCT component_name FROM marks_structures");
        console.log("Marks Structure Components:", marksProps.rows.map(r => r.component_name));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkData();
