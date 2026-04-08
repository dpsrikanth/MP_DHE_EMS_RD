const { createExam } = require('./controllers/controller');
const db = require('./db');

// Mock request
const req = {
    user: { role: 'college_admin', college_id: 10, department_id: 10 }, // Role that triggers structure check
    body: {
        name: 'Mock External Exam',
        semester_id: 15,
        college_id: 10,
        exam_type: 2,
        exam_date: '2026-06-01',
        start_time: '10:00',
        end_time: '13:00',
        program_id: 2,
        subjects: [{
            subject_id: 10, // Subject 10 has a structure but it's tied to dept 68
            exam_date: '2026-06-01',
            start_time: '10:00',
            end_time: '13:00'
        }]
    }
};

const res = {
    status: function(s) { this.statusCode = s; return this; },
    json: function(data) {
        console.log('--- Mock Response ---');
        console.log('Status Code:', this.statusCode);
        console.log('Message:', data.message || 'SUCCESS');
        process.exit(0);
    }
};

console.log("=== Testing createExam with relaxed structure validation ===");
// We bypass the transaction/client logic in the test by mocking db.query behavior if needed, 
// but here we just run it and see if it passes the structure check.
createExam(req, res).catch(err => {
    console.error(err);
    process.exit(1);
});
