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
    // 1. Check academic_years columns
    const ayCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'academic_years' ORDER BY ordinal_position`);
    console.log('academic_years columns:', ayCols.rows.map(c => c.column_name).join(', '));

    // 2. Check semesters columns
    const semCols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'semesters' ORDER BY ordinal_position`);
    console.log('semesters columns:', semCols.rows.map(c => c.column_name).join(', '));

    // 3. Get all academic years
    const ayRes = await pool.query(`SELECT * FROM academic_years ORDER BY id`);
    console.log('\n=== ACADEMIC YEARS ===');
    ayRes.rows.forEach(r => console.log(`  `, JSON.stringify(r)));

    // 4. Get all semesters
    const semRes = await pool.query(`SELECT * FROM semesters ORDER BY id`);
    console.log('\n=== SEMESTERS ===');
    semRes.rows.forEach(r => console.log(`  `, JSON.stringify(r)));

    // 5. Get ALL active milestones
    const allRes = await pool.query(`
        SELECT id, name, start_date, end_date, responsibility,
               semester_id, academic_year_id, program_id
        FROM academic_milestones
        WHERE delete_status = true
        ORDER BY semester_id, start_date ASC, id ASC
    `);

    console.log('\n=== ALL ACTIVE MILESTONES ===');
    let currentSem = null;
    allRes.rows.forEach(m => {
        if (m.semester_id !== currentSem) {
            currentSem = m.semester_id;
            console.log(`\n--- semester_id=${m.semester_id} | academic_year_id=${m.academic_year_id} | program_id=${m.program_id} ---`);
        }
        const s = m.start_date ? m.start_date.toISOString().split('T')[0] : 'null';
        const e = m.end_date ? m.end_date.toISOString().split('T')[0] : 'null';
        console.log(`  ID:${m.id} | ${m.name} | ${s} -> ${e} | ${m.responsibility}`);
    });

    console.log(`\nTotal milestones: ${allRes.rows.length}`);
    await pool.end();
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });
