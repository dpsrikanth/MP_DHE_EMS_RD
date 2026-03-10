const client = require('./db.js');

async function run() {
    try {
        console.log("Simulating lockMarks Best of 2 CUMULATIVE Pass Logic...\n");

        const marksData = {
            rows: [
                { student_id: 1, component_id: 1, marks_obtained: 18, is_absent: false }, // IA1
                { student_id: 1, component_id: 2, marks_obtained: 20, is_absent: false }, // IA2
                { student_id: 1, component_id: 3, marks_obtained: 15, is_absent: false }, // IA3
                { student_id: 1, component_id: 4, marks_obtained: 40, is_absent: false }, // Practical

                { student_id: 2, component_id: 1, marks_obtained: null, is_absent: true }, // IA1 (Absent)
                { student_id: 2, component_id: 2, marks_obtained: 15, is_absent: false }, // IA2
                { student_id: 2, component_id: 3, marks_obtained: 8, is_absent: false }, // IA3
                { student_id: 2, component_id: 4, marks_obtained: 50, is_absent: false }, // Practical

                { student_id: 3, component_id: 1, marks_obtained: 10, is_absent: false },  // IA1
                { student_id: 3, component_id: 2, marks_obtained: 12, is_absent: false }, // IA2
                { student_id: 3, component_id: 3, marks_obtained: 8, is_absent: false }, // IA3 
                { student_id: 3, component_id: 4, marks_obtained: 10, is_absent: false }, // Practical (Fail case: 22 + 10 = 32. Required: 16 + 16 = 32. PASS?)

                { student_id: 4, component_id: 1, marks_obtained: 4, is_absent: false },  // IA1
                { student_id: 4, component_id: 2, marks_obtained: 5, is_absent: false }, // IA2
                { student_id: 4, component_id: 3, marks_obtained: 6, is_absent: false }, // IA3 
                { student_id: 4, component_id: 4, marks_obtained: 60, is_absent: false }, // Practical (Pass: 11 + 60 = 71. Required: 16 + 16 = 32. PASS)
            ]
        };

        const components = {
            rows: [
                { id: 1, component_name: 'IA1', passing_marks: 8 },
                { id: 2, component_name: 'IA2', passing_marks: 8 },
                { id: 3, component_name: 'IA3', passing_marks: 8 },
                { id: 4, component_name: 'Practical', passing_marks: 16 }
            ]
        };

        const compMap = {};
        components.rows.forEach(c => {
            compMap[c.id] = c.component_name;
        });

        // 1. Group by student
        let studentsScores = {};
        marksData.rows.forEach(row => {
            if (!studentsScores[row.student_id]) studentsScores[row.student_id] = { ia: [], practical: 0 };
            let score = row.is_absent ? 0 : parseFloat(row.marks_obtained);
            let cname = compMap[row.component_id];

            if (cname) {
                let upperCname = cname.toUpperCase();
                if (upperCname.includes('IA')) {
                    studentsScores[row.student_id].ia.push({ score });
                } else if (upperCname.includes('PRACTICAL')) {
                    studentsScores[row.student_id].practical += score;
                }
            }
        });

        // 2. Cumulative Pass Logic
        for (let sid in studentsScores) {
            let s = studentsScores[sid];

            // Prep Pass Threshold
            let iaPassMarks = [];
            let otherPassMarks = 0;
            let cumulativePassMarks = 0;
            let hasExplicitTotal = false;

            components.rows.forEach(c => {
                let cname = c.component_name.toUpperCase();
                if (cname.includes('TOTAL') || cname.includes('BEST_OF_3')) {
                    cumulativePassMarks = parseFloat(c.passing_marks) || 0;
                    hasExplicitTotal = true;
                } else if (cname.includes('IA')) {
                    iaPassMarks.push(parseFloat(c.passing_marks) || 0);
                } else {
                    otherPassMarks += parseFloat(c.passing_marks) || 0;
                }
            });

            if (!hasExplicitTotal) {
                iaPassMarks.sort((a, b) => b - a);
                cumulativePassMarks = (iaPassMarks[0] || 0) + (iaPassMarks[1] || 0) + otherPassMarks;
            }

            // Student Result
            s.ia.sort((a, b) => b.score - a.score);
            let bestOf2Score = (s.ia[0]?.score || 0) + (s.ia[1]?.score || 0);
            let total = bestOf2Score + s.practical;
            let passStatus = total >= cumulativePassMarks ? 'Pass' : 'Fail';

            console.log(`Student ${sid}:`);
            console.log(`  IAs: ${s.ia.map(i => i.score).join(', ')}`);
            console.log(`  Best of 2 Score: ${bestOf2Score}`);
            console.log(`  Practical Score: ${s.practical}`);
            console.log(`  Total: ${total} (Required: ${cumulativePassMarks})`);
            console.log(`  Status: ${passStatus}\n`);
        }

    } catch (error) {
        console.error("Test failed", error);
    } finally {
        client.end();
    }
}

run();
