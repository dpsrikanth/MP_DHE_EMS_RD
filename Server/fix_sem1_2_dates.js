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
    const sem1Map = [
        { match: (n) => n === 'COMMENCEMENT OF CLASSES', start: '2024-07-14', end: '2024-07-14' },
        
        { match: (n) => n.includes('INTERNAL EXAM 1') && n.includes('SCHEDULE'), start: '2024-08-01', end: '2024-08-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 1') || n === 'INTERNAL EXAM 1 (MID-1)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2024-08-10', end: '2024-08-15' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-1'), start: '2024-08-16', end: '2024-08-20' },
        { match: (n) => n.includes('INTERNAL MARKS APPROVAL') && n.includes('MID-1'), start: '2024-08-21', end: '2024-08-22' },

        { match: (n) => n.includes('INTERNAL EXAM 2') && n.includes('SCHEDULE'), start: '2024-09-01', end: '2024-09-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 2') || n === 'INTERNAL EXAM 2 (MID-2)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2024-09-10', end: '2024-09-15' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-2'), start: '2024-09-16', end: '2024-09-20' },
        { match: (n) => n.includes('INTERNAL MARKS APPROVAL') && n.includes('MID-2'), start: '2024-09-21', end: '2024-09-22' },

        { match: (n) => n.includes('INTERNAL EXAM 3') && n.includes('SCHEDULE'), start: '2024-10-01', end: '2024-10-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 3') || n === 'INTERNAL EXAM 3 (MID-3)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2024-10-10', end: '2024-10-15' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-3'), start: '2024-10-16', end: '2024-10-20' },
        { match: (n) => n.includes('INTERNAL MARKS APPROVAL') && n.includes('MID-3'), start: '2024-10-21', end: '2024-10-22' },

        { match: (n) => n.includes('PRACTICAL') && n.includes('SCHEDULE'), start: '2024-10-24', end: '2024-10-29' },
        { match: (n) => n === 'PRACTICAL EXAM', start: '2024-10-31', end: '2024-11-04' },
        { match: (n) => n.includes('PRACTICAL MARKS ENTRY'), start: '2024-11-05', end: '2024-11-07' },
        { match: (n) => n.includes('PRACTICAL MARKS APPROVAL'), start: '2024-11-08', end: '2024-11-09' },

        { match: (n) => n.includes('INTERNAL MARKS LOCK') || n.includes('MARKS LOCK & SUBMISSION'), start: '2024-11-10', end: '2024-11-12' },
        { match: (n) => n.includes('SEATING ARRANGEMENT LOCK'), start: '2024-11-13', end: '2024-11-15' },

        { match: (n) => n.includes('STUDENT ENROLL'), start: '2024-11-16', end: '2024-11-18' },
        { match: (n) => n.includes('SEAT ALLOCATION'), start: '2024-11-19', end: '2024-11-20' },
        { match: (n) => n.includes('HALL TICKET'), start: '2024-11-21', end: '2024-11-22' },

        { match: (n) => n.includes('EXTERNAL EXAM REGISTRATION'), start: '2024-11-10', end: '2024-11-20' },
        { match: (n) => n.includes('EXTERNAL FACULTY ASSIGNMENT'), start: '2024-11-15', end: '2024-11-25' },
        
        { match: (n) => n.includes('QUESTION PAPER UPLOAD'), start: '2024-11-20', end: '2024-11-22' },
        { match: (n) => n.includes('QUESTION PAPER FINALIZATION'), start: '2024-11-23', end: '2024-11-24' },

        { match: (n) => n.includes('LAST WORKING DAY'), start: '2024-12-04', end: '2024-12-04' },
        { match: (n) => n.includes('EXTERNAL') && n.includes('END SEMESTER'), start: '2024-12-05', end: '2024-12-20' },
        { match: (n) => n.includes('VALUATION OF ANSWER SCRIPTS'), start: '2024-12-25', end: '2025-01-09' },
        { match: (n) => n.includes('RESULTS DECLARATION') || n === 'RESULTS DECLARATION', start: '2025-01-15', end: '2025-01-15' },
    ];

    const sem2Map = [
        { match: (n) => n === 'COMMENCEMENT OF CLASSES', start: '2025-01-14', end: '2025-01-14' },
        
        { match: (n) => n.includes('INTERNAL EXAM 1') && n.includes('SCHEDULE'), start: '2025-02-01', end: '2025-02-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 1') || n === 'INTERNAL EXAM 1 (MID-1)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2025-02-10', end: '2025-02-15' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-1'), start: '2025-02-16', end: '2025-02-20' },
        { match: (n) => n.includes('INTERNAL MARKS APPROVAL') && n.includes('MID-1'), start: '2025-02-21', end: '2025-02-22' },

        { match: (n) => n.includes('INTERNAL EXAM 2') && n.includes('SCHEDULE'), start: '2025-03-01', end: '2025-03-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 2') || n === 'INTERNAL EXAM 2 (MID-2)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2025-03-10', end: '2025-03-15' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-2'), start: '2025-03-16', end: '2025-03-20' },
        { match: (n) => n.includes('INTERNAL MARKS APPROVAL') && n.includes('MID-2'), start: '2025-03-21', end: '2025-03-22' },

        { match: (n) => n.includes('INTERNAL EXAM 3') && n.includes('SCHEDULE'), start: '2025-04-01', end: '2025-04-05' },
        { match: (n) => (n.includes('INTERNAL EXAM 3') || n === 'INTERNAL EXAM 3 (MID-3)') && !n.includes('SCHEDULE') && !n.includes('MARKS'), start: '2025-04-10', end: '2025-04-15' },
        { match: (n) => n.includes('INTERNAL MARKS ENTRY') && n.includes('MID-3'), start: '2025-04-16', end: '2025-04-20' },
        { match: (n) => n.includes('INTERNAL MARKS APPROVAL') && n.includes('MID-3'), start: '2025-04-21', end: '2025-04-22' },

        { match: (n) => n.includes('PRACTICAL') && n.includes('SCHEDULE'), start: '2025-04-26', end: '2025-05-01' },
        { match: (n) => n === 'PRACTICAL EXAM', start: '2025-05-03', end: '2025-05-07' },
        { match: (n) => n.includes('PRACTICAL MARKS ENTRY'), start: '2025-05-08', end: '2025-05-10' },
        { match: (n) => n.includes('PRACTICAL MARKS APPROVAL'), start: '2025-05-11', end: '2025-05-12' },

        { match: (n) => n.includes('INTERNAL MARKS LOCK') || n.includes('MARKS LOCK & SUBMISSION'), start: '2025-05-13', end: '2025-05-15' },
        { match: (n) => n.includes('SEATING ARRANGEMENT LOCK'), start: '2025-05-16', end: '2025-05-18' },

        { match: (n) => n.includes('STUDENT ENROLL'), start: '2025-05-19', end: '2025-05-21' },
        { match: (n) => n.includes('SEAT ALLOCATION'), start: '2025-05-22', end: '2025-05-23' },
        { match: (n) => n.includes('HALL TICKET'), start: '2025-05-24', end: '2025-05-25' },

        { match: (n) => n.includes('EXTERNAL EXAM REGISTRATION'), start: '2025-05-15', end: '2025-05-22' },
        { match: (n) => n.includes('EXTERNAL FACULTY ASSIGNMENT'), start: '2025-05-20', end: '2025-05-30' },
        
        { match: (n) => n.includes('QUESTION PAPER UPLOAD'), start: '2025-05-23', end: '2025-05-25' },
        { match: (n) => n.includes('QUESTION PAPER FINALIZATION'), start: '2025-05-26', end: '2025-05-27' },

        { match: (n) => n.includes('LAST WORKING DAY'), start: '2025-06-06', end: '2025-06-06' },
        { match: (n) => n.includes('EXTERNAL') && n.includes('END SEMESTER'), start: '2025-06-07', end: '2025-06-25' },
        { match: (n) => n.includes('VALUATION OF ANSWER SCRIPTS'), start: '2025-06-27', end: '2025-07-12' },
        { match: (n) => n.includes('RESULTS DECLARATION') || n === 'RESULTS DECLARATION', start: '2025-07-20', end: '2025-07-20' },
    ];

    console.log('=== FIXING SEMESTER 1 & 2 DATES ===\n');
    let updated = 0;

    const current = await pool.query(`
        SELECT id, name, semester_id
        FROM academic_milestones 
        WHERE delete_status = true AND semester_id IN (15, 16)
    `);

    for (const m of current.rows) {
        const nameUpper = m.name.toUpperCase().trim();
        const ruleMap = m.semester_id === 15 ? sem1Map : sem2Map;
        let matched = false;

        for (const rule of ruleMap) {
            if (rule.match(nameUpper)) {
                await pool.query(
                    `UPDATE academic_milestones SET start_date = $1, end_date = $2 WHERE id = $3`,
                    [rule.start, rule.end, m.id]
                );
                console.log(`✓ Sem${m.semester_id===15?1:2} ID:${m.id} "${m.name}" -> ${rule.start} to ${rule.end}`);
                updated++;
                matched = true;
                break;
            }
        }
        if (!matched) console.log(`? Sem${m.semester_id===15?1:2} ID:${m.id} "${m.name}" -> NO MATCH`);
    }

    console.log(`\nDone! Updated ${updated} milestones.`);
    await pool.end();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
