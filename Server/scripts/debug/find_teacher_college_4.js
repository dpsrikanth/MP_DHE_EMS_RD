const pool = require('../../db');
(async () => {
    try {
        const res = await pool.query("SELECT * FROM master_teachers WHERE college_id = 4;");
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
