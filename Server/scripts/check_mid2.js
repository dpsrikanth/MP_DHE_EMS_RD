const pool = require('../db');

async function run() {
    try {
        const res = await pool.query("SELECT id, name, start_date FROM academic_milestones");
        res.rows.forEach(r => {
            if (r.name.includes("MID-2") || r.name.includes("MID-3") || r.name.includes("MID- 2") || r.name.includes("MID- 3")) {
                console.log(`[${r.id}] ${r.name} | ${r.start_date}`);
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();

