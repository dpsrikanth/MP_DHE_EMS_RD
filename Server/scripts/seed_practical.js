const pool = require('../db');
async function run() {
    try {
        const milestones = [
            {
                name: 'PRACTICAL EXAM SCHEDULE DETAILS',
                start: '2024-11-01 00:00:00',
                end: '2024-11-05 23:59:59'
            }
        ];

        for (const m of milestones) {
            await pool.query("DELETE FROM academic_milestones WHERE name = $1", [m.name]);
            await pool.query(
                `INSERT INTO academic_milestones (name, start_date, end_date, type, responsibility) 
                 VALUES ($1, $2, $3, 'Internal', 'COLLEGE')`,
                [m.name, m.start, m.end]
            );
            console.log(`Successfully added ${m.name}`);
        }
    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();

