const { applyGraceMarks } = require('./utils/graceUtils');
async function test() {
    const studentId = 3;
    const examName = 'BTech Sem-1 MP UNIVERSITY External Exam 2024-2025';
    const universityId = 7;
    try {
        console.log('Running applyGraceMarks...');
        const result = await applyGraceMarks(studentId, examName, universityId, 1);
        console.log('Result:', result);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
test();
