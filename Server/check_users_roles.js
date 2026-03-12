const pool = require('./db');
(async () => {
    try {
        const res = await pool.query("SELECT u.id, u.name, u.role_id, u.college_id FROM users u;");
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
