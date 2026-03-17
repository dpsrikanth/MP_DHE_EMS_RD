const db = require('./db');

async function testLock() {
    const subject_id = 10;
    const section = 'A';
    const college_id = 10;
    const semester_id = 15;
    const academic_year_id = 1;
    const approved_by = 11;

    try {
        console.log('--- Fetching Marks and Structure ---');
        const marksData = await db.query('SELECT * FROM student_internal_marks WHERE subject_id = $1', [subject_id]);
        console.log('Marks rows:', marksData.rows.length);

        const components = await db.query('SELECT id, component_name, passing_marks FROM internal_marks_structure WHERE subject_id = $1', [subject_id]);
        console.log('Components rows:', components.rows.length);

        const compMap = {};
        const compPassMap = {};
        components.rows.forEach(c => {
            compMap[c.id] = c.component_name;
            compPassMap[c.id] = parseFloat(c.passing_marks) || 0;
        });

        let studentsScores = {};
        marksData.rows.forEach(row => {
            if (!studentsScores[row.student_id]) studentsScores[row.student_id] = { ia: [], practical: 0, hasFailedComponent: false };
            let score = row.is_absent ? 0 : parseFloat(row.marks_obtained);
            let cname = compMap[row.component_id];
            let pMark = compPassMap[row.component_id] || 0;

            if (cname) {
                let upperCname = cname.toUpperCase();
                console.log(`Student ${row.student_id}, Component: ${cname}, Score: ${score}`);
                if (upperCname.includes('IA')) {
                    studentsScores[row.student_id].ia.push({ score, pMark });
                } else if (upperCname.includes('PRACTICAL')) {
                    studentsScores[row.student_id].practical += score;
                    if (score < pMark) studentsScores[row.student_id].hasFailedComponent = true;
                }
            }
        });

        console.log('\n--- Calculated Student Scores ---');
        console.log(JSON.stringify(studentsScores, null, 2));

        for (let sid in studentsScores) {
            let s = studentsScores[sid];
            s.ia.sort((a, b) => b.score - a.score);
            let bestOf2Score = (s.ia[0]?.score || 0) + (s.ia[1]?.score || 0);
            let total = bestOf2Score + s.practical;
            
            console.log(`Student ${sid}: BestOf2=${bestOf2Score}, Practical=${s.practical}, Total=${total}`);
            
            console.log('Attempting Insert for Student:', sid);
            const res = await db.query(`
                INSERT INTO calculated_internal_marks 
                (student_id, subject_id, college_id, semester_id, academic_year_id, best_of_3_score, practical_score, total_internal, passing_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pass')
                ON CONFLICT (student_id, subject_id, college_id, semester_id, academic_year_id) 
                DO UPDATE SET total_internal = EXCLUDED.total_internal
                RETURNING *
            `, [sid, subject_id, college_id, semester_id, academic_year_id, bestOf2Score, s.practical, total]);
            console.log('Inserted/Updated:', res.rows[0]);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

testLock();
