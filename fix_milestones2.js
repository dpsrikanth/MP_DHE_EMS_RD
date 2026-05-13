const db = require('./Server/config/db');

async function main() {
    // Show current state
    const r = await db.query(`
        SELECT id, name, start_date, end_date, sort_order 
        FROM academic_milestones 
        WHERE delete_status = true 
        ORDER BY sort_order, id
    `);
    
    console.log('Current milestones:');
    r.rows.forEach(m => {
        const s = m.start_date ? m.start_date.toISOString().split('T')[0] : 'null';
        const e = m.end_date ? m.end_date.toISOString().split('T')[0] : 'null';
        console.log(`ID:${m.id} | sort:${m.sort_order} | ${m.name} | ${s} -> ${e}`);
    });

    // Define logically sequenced date ranges for Sem 3 milestones
    // Each milestone gets a unique sequential date range (2-week windows)
    const milestoneSchedule = [
        { pattern: 'INTERNAL EXAM 1 SCHEDULE', start: '2026-05-01', end: '2026-05-10' },
        { pattern: 'INTERNAL EXAM 1', start: '2026-05-11', end: '2026-05-20' },
        { pattern: 'INTERNAL EXAM 2 SCHEDULE', start: '2026-06-01', end: '2026-06-10' },
        { pattern: 'INTERNAL EXAM 2', start: '2026-06-11', end: '2026-06-20' },
        { pattern: 'INTERNAL EXAM 3 SCHEDULE', start: '2026-07-01', end: '2026-07-10' },
        { pattern: 'INTERNAL EXAM 3', start: '2026-07-11', end: '2026-07-20' },
        { pattern: 'INTERNAL MARKS LOCK', start: '2026-07-21', end: '2026-07-31' },
        { pattern: 'STUDENT ENROLL', start: '2026-08-01', end: '2026-08-10' },
        { pattern: 'SEAT ALLOCATION', start: '2026-08-11', end: '2026-08-20' },
        { pattern: 'HALL TICKET', start: '2026-08-21', end: '2026-08-31' },
        { pattern: 'EXTERNAL', start: '2026-09-01', end: '2026-09-30' },
        { pattern: 'RESULTS', start: '2026-10-01', end: '2026-10-31' },
    ];

    // Also fix sort_order for Internal Exam 1 (Mid-1) to appear AFTER its schedule
    for (const m of r.rows) {
        const nameUpper = m.name.toUpperCase();
        
        for (const sched of milestoneSchedule) {
            if (nameUpper.includes(sched.pattern)) {
                await db.query(
                    `UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = $3`,
                    [sched.start, sched.end, m.id]
                );
                console.log(`Updated ID:${m.id} "${m.name}" -> ${sched.start} to ${sched.end}`);
                break;
            }
        }
    }

    // Fix sort_order: ensure "SCHEDULE" milestone comes before the exam milestone
    // Get schedule milestone sort_orders and bump exam sort_orders accordingly
    const schedRows = r.rows.filter(m => m.name.toUpperCase().includes('SCHEDULE'));
    for (const sched of schedRows) {
        // Find the matching exam milestone (same pattern without SCHEDULE)
        const examName = sched.name.toUpperCase().replace(' SCHEDULE DETAILS', '').replace(' SCHEDULE', '');
        const examRow = r.rows.find(m => 
            m.name.toUpperCase().includes(examName) && 
            !m.name.toUpperCase().includes('SCHEDULE') &&
            m.id !== sched.id
        );
        if (examRow && examRow.sort_order <= sched.sort_order) {
            const newSortOrder = (sched.sort_order || 0) + 1;
            await db.query(
                `UPDATE academic_milestones SET sort_order = $1 WHERE id = $2`,
                [newSortOrder, examRow.id]
            );
            console.log(`Fixed sort order: "${examRow.name}" -> sort_order=${newSortOrder}`);
        }
    }

    console.log('\nDone!');
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
