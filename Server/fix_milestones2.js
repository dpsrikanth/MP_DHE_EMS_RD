require('dotenv').config({ path: './config/.env' });
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
});

async function main() {
    // Check actual columns
    const cols = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'academic_milestones' ORDER BY ordinal_position
    `);
    console.log('Columns:', cols.rows.map(c => c.column_name).join(', '));

    const r = await pool.query(`
        SELECT id, name, start_date, end_date
        FROM academic_milestones 
        WHERE delete_status = true 
        ORDER BY id
    `);

    console.log('\n=== CURRENT MILESTONES ===');
    r.rows.forEach(m => {
        const s = m.start_date ? m.start_date.toISOString().split('T')[0] : 'null';
        const e = m.end_date ? m.end_date.toISOString().split('T')[0] : 'null';
        console.log(`ID:${m.id} | ${m.name} | ${s} -> ${e}`);
    });

    // Assign unique sequential date ranges based on milestone name
    console.log('\n=== APPLYING DATE UPDATES ===');
    for (const m of r.rows) {
        const name = m.name.toUpperCase();
        let start, end;

        if (name.includes('INTERNAL EXAM 1') && name.includes('SCHEDULE')) {
            start = '2026-05-01'; end = '2026-05-10';
        } else if ((name.includes('INTERNAL EXAM 1') || name.includes('MID-1') || name.includes('MID 1') || name.includes('IA1') || name.includes('IA 1')) && !name.includes('SCHEDULE')) {
            start = '2026-05-11'; end = '2026-05-25';
        } else if (name.includes('INTERNAL EXAM 2') && name.includes('SCHEDULE')) {
            start = '2026-06-01'; end = '2026-06-10';
        } else if ((name.includes('INTERNAL EXAM 2') || name.includes('MID-2') || name.includes('MID 2') || name.includes('IA2') || name.includes('IA 2')) && !name.includes('SCHEDULE')) {
            start = '2026-06-11'; end = '2026-06-25';
        } else if (name.includes('INTERNAL EXAM 3') && name.includes('SCHEDULE')) {
            start = '2026-07-01'; end = '2026-07-10';
        } else if ((name.includes('INTERNAL EXAM 3') || name.includes('MID-3') || name.includes('MID 3') || name.includes('IA3') || name.includes('IA 3')) && !name.includes('SCHEDULE')) {
            start = '2026-07-11'; end = '2026-07-25';
        } else if (name.includes('MARKS LOCK') || name.includes('LOCK')) {
            start = '2026-07-26'; end = '2026-07-31';
        } else if (name.includes('STUDENT ENROLL') || name.includes('ENROLL')) {
            start = '2026-08-01'; end = '2026-08-10';
        } else if (name.includes('SEAT ALLOCATION') || name.includes('SEATING')) {
            start = '2026-08-11'; end = '2026-08-20';
        } else if (name.includes('HALL TICKET')) {
            start = '2026-08-21'; end = '2026-08-31';
        } else if (name.includes('EXTERNAL') || name.includes('END SEMESTER')) {
            start = '2026-09-01'; end = '2026-09-30';
        } else if (name.includes('RESULT')) {
            start = '2026-10-01'; end = '2026-10-31';
        }

        if (start && end) {
            await pool.query(
                `UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = $3`,
                [start, end, m.id]
            );
            console.log(`✓ ID:${m.id} "${m.name}" -> ${start} to ${end}`);
        } else {
            console.log(`? ID:${m.id} "${m.name}" -> NO MATCH (skipped)`);
        }
    }

    console.log('\nDone!');
    await pool.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
