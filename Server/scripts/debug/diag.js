const db = require('../../db.js');
async function test() {
    try {
        const query = `
            SELECT s.id, s.name, s.rollnumber as current_rollnumber, s."programName", s.semister, s."collageName"
            FROM students s
            WHERE s."deleteStatus" = true
        `;
        const res = await db.query(query);
        console.log("Total students:", res.rowCount);
        // Find Sanjana KC
        const sanjana = res.rows.find(r => r.name.includes("Sanjana"));
        console.log("Sanjana details:", sanjana);
    } catch(e) { console.error(e); }
    process.exit(0);
}
test();
