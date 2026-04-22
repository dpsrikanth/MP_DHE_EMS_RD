const fs = require('fs');
const db = require('../../db');
(async () => {
    try {
        const query = `SELECT id, name, status, is_published, student_application_open FROM exams LIMIT 5`;
        const r = await db.query(query);
        fs.writeFileSync('tmp_exams.json', JSON.stringify(r.rows, null, 2));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
