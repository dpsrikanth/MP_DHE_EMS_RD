const db = require('../../db');

async function fix() {
    try {
        const res = await db.query('SELECT id, first_name, rollnumber FROM students ORDER BY id');
        const students = res.rows;
        const seen = {};
        
        console.log(`Checking ${students.length} students...`);
        
        for (const s of students) {
            const roll = (s.rollnumber || '').trim();
            if (!roll) continue;

            if (!seen[roll]) {
                seen[roll] = 1;
            } else {
                seen[roll]++;
                const newRoll = `${roll}-${seen[roll]}`;
                await db.query('UPDATE students SET rollnumber = $1 WHERE id = $2', [newRoll, s.id]);
                console.log(`Updated student ID ${s.id} (${s.first_name}): ${roll} -> ${newRoll}`);
            }
        }
        console.log('Data correction complete.');
    } catch (err) {
        console.error('Error during update:', err);
    } finally {
        process.exit(0);
    }
}

fix();
