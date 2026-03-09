const client = require('./db.js');

async function run() {
    try {
        console.log("Simulating lockMarks Best of 2 Logic...\n");
        const passMarks = 40;

        // Mock data matching the structure in collegeAdminController.js
        const marksData = {
            rows: [
                { student_id: 1, component_id: 1, marks_obtained: 10, is_absent: false }, // IA1
                { student_id: 1, component_id: 2, marks_obtained: 18, is_absent: false }, // IA2
                { student_id: 1, component_id: 3, marks_obtained: 15, is_absent: false }, // IA3
                { student_id: 1, component_id: 4, marks_obtained: 40, is_absent: false }, // Practical

                { student_id: 2, component_id: 1, marks_obtained: null, is_absent: true }, // IA1 (Absent)
                { student_id: 2, component_id: 2, marks_obtained: 12, is_absent: false }, // IA2
                { student_id: 2, component_id: 3, marks_obtained: 14, is_absent: false }, // IA3
                { student_id: 2, component_id: 4, marks_obtained: 45, is_absent: false }, // Practical

                { student_id: 3, component_id: 1, marks_obtained: 5, is_absent: false },  // IA1
                { student_id: 3, component_id: 2, marks_obtained: null, is_absent: true }, // IA2 (Absent)
                { student_id: 3, component_id: 3, marks_obtained: null, is_absent: true }, // IA3 (Absent)
                { student_id: 3, component_id: 4, marks_obtained: 30, is_absent: false }, // Practical (Fail case)
            ]
        };

        const compMap = {
            1: 'IA1',
            2: 'IA2',
            3: 'IA3',
            4: 'Practical'
        };

        // 1. Group by student
        let studentsScores = {};
        marksData.rows.forEach(row => {
            if (!studentsScores[row.student_id]) studentsScores[row.student_id] = { ia: [], practical: 0 };

            // Treat absent as 0
            let score = row.is_absent ? 0 : parseFloat(row.marks_obtained);
            let cname = compMap[row.component_id];

            if (cname && cname.toUpperCase().includes('IA')) {
                studentsScores[row.student_id].ia.push(score);
            } else if (cname && cname.toUpperCase().includes('PRACTICAL')) {
                studentsScores[row.student_id].practical = score;
            }
        });

        // 2. Calculate Best of 2
        for (let sid in studentsScores) {
            let s = studentsScores[sid];

            // Sort descending
            s.ia.sort((a, b) => b - a);

            // Sum top 2 of IA
            let bestOf2 = (s.ia[0] || 0) + (s.ia[1] || 0);
            let total = bestOf2 + s.practical;
            let passStatus = total >= passMarks ? 'Pass' : 'Fail';

            console.log(`Student ${sid}:`);
            console.log(`  IAs: ${s.ia.join(', ')}`);
            console.log(`  Best of 2: ${bestOf2}`);
            console.log(`  Practical: ${s.practical}`);
            console.log(`  Total: ${total}`);
            console.log(`  Status: ${passStatus}\n`);
        }

    } catch (error) {
        console.error("Test failed", error);
    } finally {
        client.end();
    }
}

run();
