const pool = require('../db.js');
async function run() {
    try {
        const collegeName = 'Mp college';
        const programName = 'BTech';
        const subjectId = 10; // Programming for Problem Solving

        console.log('Testing fixed General Marks roster (no semester filter)...');

        const query = `
          SELECT 
            s.id as student_id,
            TRIM(s.name) as student_name,
            s.semister,
            m.id as mark_id
          FROM students s
          LEFT JOIN marks m ON s.id = m.student_id 
            AND m.subject_id = $3 
          WHERE s."collageName" ILIKE $1 
            AND s."programName" ILIKE $2 
            AND s."deleteStatus" = true
          ORDER BY s.rollnumber ASC NULLS LAST, s.name ASC
        `;

        const values = [`%${collegeName}%`, `%${programName}%`, subjectId];
        const res = await pool.query(query, values);
        
        console.log('---START---');
        console.log('Count:', res.rowCount);
        res.rows.forEach(r => {
            console.log(`${r.student_name} | ${r.semister} | marks=${r.mark_id || 'none'}`);
        });
        console.log('---END---');
    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        pool.end();
    }
}
run();

