const db = require('./db.js');
async function fixRolls() {
    try {
        const res = await db.query("SELECT id, rollnumber FROM students WHERE rollnumber LIKE '%-%'");
        console.log(`Found ${res.rowCount} records with hyphenated roll numbers.`);
        let i = 1;
        for (const row of res.rows) {
            let baseParams = row.rollnumber.split('-')[0].slice(0, 8); // e.g. 163B1A05
            let suffixStr = (50 + i).toString().padStart(2, '0');
            let newRoll = baseParams + suffixStr;
            await db.query("UPDATE students SET rollnumber = $1 WHERE id = $2", [newRoll, row.id]);
            try { await db.query("UPDATE attendance SET rollnumber = $1 WHERE student_id = $2", [newRoll, row.id]); } catch (e) {}
            console.log(`Updated ID ${row.id}: ${row.rollnumber} -> ${newRoll}`);
            i++;
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fixRolls();
