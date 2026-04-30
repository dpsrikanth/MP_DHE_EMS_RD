const { applyGraceMarks } = require('./utils/graceUtils');
const db = require('./db');

// Mock db.query for testing the scenarios
const originalQuery = db.query;

async function runTests() {
    let currentScenario = '';

    // Mock grading config
    const mockConfig = {
        rows: [{
            pass_threshold: 40,
            grace_policy: {
                is_enabled: true,
                max_per_subject_grace: 5
            }
        }]
    };

    // Helper to generate mock marks
    const generateMarks = (marksList) => {
        return {
            rows: marksList.map((m, i) => ({
                id: i + 1,
                subject_name: `Sub_${i+1}`,
                projected_total_marks: m.total,
                entered_internal: m.internal || 20,
                calculated_internal: m.internal || 20,
                total_marks: m.total,
                status: 'Fail'
            }))
        };
    };

    db.query = async (q, params) => {
        if (q.includes('SELECT * FROM grading_configs')) return mockConfig;
        
        if (q.includes('WITH ia_summary AS')) {
            if (currentScenario === 'Student A') {
                // Needs 3 marks in Maths -> PASS
                return generateMarks([
                    { total: 37 }, // Sub 1: Needs 3
                    { total: 60 },
                    { total: 60 },
                    { total: 60 },
                    { total: 60 }
                ]);
            }
            if (currentScenario === 'Student B') {
                // Needs 3 in Maths, 2 in Physics -> PASS
                return generateMarks([
                    { total: 37 }, // Needs 3
                    { total: 38 }, // Needs 2
                    { total: 60 },
                    { total: 60 },
                    { total: 60 }
                ]);
            }
            if (currentScenario === 'Student C') {
                // Needs 4 in Maths, 3 in Physics -> FAIL
                return generateMarks([
                    { total: 36 }, // Needs 4
                    { total: 37 }, // Needs 3
                    { total: 60 },
                    { total: 60 },
                    { total: 60 }
                ]);
            }
            if (currentScenario === 'Student D') {
                // Needs 6 in one -> FAIL
                return generateMarks([
                    { total: 34 }, // Needs 6
                    { total: 60 },
                    { total: 60 },
                    { total: 60 },
                    { total: 60 }
                ]);
            }
            if (currentScenario === 'Student Fail > 2') {
                // 3 fails
                return generateMarks([
                    { total: 38 }, // Needs 2
                    { total: 38 }, // Needs 2
                    { total: 39 }, // Needs 1
                    { total: 60 },
                    { total: 60 }
                ]);
            }
        }
        
        // Mock connection client for transaction
        return { rows: [] };
    };
    
    db.connect = async () => {
        return {
            query: async () => {},
            release: () => {}
        };
    };

    const scenarios = ['Student A', 'Student B', 'Student C', 'Student D', 'Student Fail > 2'];
    for (const sc of scenarios) {
        currentScenario = sc;
        console.log(`\n--- Running: ${sc} ---`);
        const used = await applyGraceMarks('STU123', 'EXAM1', 1);
        console.log(`Result Grace Used: ${used}`);
    }
}

runTests().catch(console.error).finally(() => {
    db.query = originalQuery;
    process.exit(0);
});
