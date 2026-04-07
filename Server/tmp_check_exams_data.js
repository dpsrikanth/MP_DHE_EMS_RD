const db = require('./db');
(async () => {
    try {
        const res = await db.query(`SELECT id, name, exam_date, start_time, end_time FROM exams LIMIT 5`);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
