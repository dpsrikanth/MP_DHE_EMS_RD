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
    // 1. Show current state of Semester 3 milestones
    const current = await pool.query(`
        SELECT id, name, start_date, end_date, semester_id, program_id, academic_year_id
        FROM academic_milestones 
        WHERE delete_status = true 
        AND semester_id = 17
        ORDER BY start_date ASC, id ASC
    `);

    console.log('=== CURRENT SEMESTER 3 MILESTONES ===');
    current.rows.forEach(m => {
        const s = m.start_date ? m.start_date.toISOString().split('T')[0] : 'null';
        const e = m.end_date ? m.end_date.toISOString().split('T')[0] : 'null';
        console.log(`ID:${m.id} | ${m.name} | ${s} -> ${e}`);
    });

    console.log(`\nTotal: ${current.rows.length} milestones\n`);

    // 2. Define correct date mapping for each milestone
    // Chronological order: Schedule Details BEFORE the actual exam
    const dateMap = [
        { match: (n) => n === 'COMMENCEMENT OF CLASSES', start: '2026-05-01', end: '2026-05-01' },
        
        // Mid-1 block: Schedule Details FIRST, then Exam, then Marks Entry
        { match: (n) => n.includes('INTERNAL EXAM 1') && n.includes('SCHEDULE'), start: '2026-05-04', end: '2026-05-08' },
        { match: (n) => (n.includes('INTERNAL EXAM 1') || n === 'INTERNAL EXAM 1 (MID-1)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2026-05-11', end: '2026-05-16' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-1'), start: '2026-05-18', end: '2026-05-22' },

        // Mid-2 block
        { match: (n) => n.includes('INTERNAL EXAM 2') && n.includes('SCHEDULE'), start: '2026-06-01', end: '2026-06-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 2') || n === 'INTERNAL EXAM 2 (MID-2)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2026-06-08', end: '2026-06-13' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-2'), start: '2026-06-15', end: '2026-06-19' },

        // Mid-3 block
        { match: (n) => n.includes('INTERNAL EXAM 3') && n.includes('SCHEDULE'), start: '2026-06-22', end: '2026-06-26' },
        { match: (n) => (n.includes('INTERNAL EXAM 3') || n === 'INTERNAL EXAM 3 (MID-3)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2026-06-29', end: '2026-07-04' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-3'), start: '2026-07-06', end: '2026-07-10' },

        // Practical block
        { match: (n) => n.includes('PRACTICAL') && n.includes('SCHEDULE'), start: '2026-07-13', end: '2026-07-15' },
        { match: (n) => n === 'PRACTICAL EXAM', start: '2026-07-16', end: '2026-07-21' },
        { match: (n) => n.includes('PRACTICAL MARKS ENTRY'), start: '2026-07-22', end: '2026-07-25' },
        { match: (n) => n.includes('PRACTICAL MARKS APPROVAL'), start: '2026-07-27', end: '2026-07-28' },

        // End-of-semester block
        { match: (n) => n.includes('EXTERNAL EXAM REGISTRATION'), start: '2026-07-29', end: '2026-08-05' },
        { match: (n) => n.includes('INTERNAL MARKS LOCK') || n.includes('MARKS LOCK & SUBMISSION'), start: '2026-08-06', end: '2026-08-08' },
        { match: (n) => n.includes('STUDENT ENROLL'), start: '2026-08-10', end: '2026-08-14' },
        { match: (n) => n.includes('SEAT ALLOCATION'), start: '2026-08-17', end: '2026-08-19' },
        { match: (n) => n.includes('HALL TICKET'), start: '2026-08-20', end: '2026-08-21' },
        { match: (n) => n.includes('EXTERNAL') && n.includes('END SEMESTER'), start: '2026-08-24', end: '2026-09-08' },
        { match: (n) => n.includes('RESULTS DECLARATION') || n === 'RESULTS DECLARATION', start: '2026-09-15', end: '2026-09-15' },
    ];

    // 3. Apply updates
    console.log('=== APPLYING DATE UPDATES ===\n');
    let updated = 0;
    let skipped = 0;

    for (const m of current.rows) {
        const nameUpper = m.name.toUpperCase().trim();
        let matched = false;

        for (const rule of dateMap) {
            if (rule.match(nameUpper)) {
                await pool.query(
                    `UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = $3`,
                    [rule.start, rule.end, m.id]
                );
                console.log(`✓ ID:${m.id} "${m.name}" -> ${rule.start} to ${rule.end}`);
                updated++;
                matched = true;
                break;
            }
        }

        if (!matched) {
            console.log(`? ID:${m.id} "${m.name}" -> NO MATCH (skipped)`);
            skipped++;
        }
    }

    // 4. Verify the result
    console.log(`\n=== SUMMARY ===`);
    console.log(`Updated: ${updated}, Skipped: ${skipped}`);

    const verify = await pool.query(`
        SELECT id, name, start_date, end_date
        FROM academic_milestones 
        WHERE delete_status = true 
        AND semester_id = 17
        ORDER BY start_date ASC, id ASC
    `);

    console.log('\n=== VERIFIED SEMESTER 3 MILESTONES (after fix) ===');
    verify.rows.forEach(m => {
        const s = m.start_date ? m.start_date.toISOString().split('T')[0] : 'null';
        const e = m.end_date ? m.end_date.toISOString().split('T')[0] : 'null';
        console.log(`ID:${m.id} | ${m.name} | ${s} -> ${e}`);
    });

    console.log('\nDone!');
    await pool.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
