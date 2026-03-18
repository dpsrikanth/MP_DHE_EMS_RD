const pool = require('./db');

async function debug() {
    try {
        const res = await pool.query("SELECT * FROM marks WHERE status = 'Pending Approval' LIMIT 10");
        console.log("Marks with 'Pending Approval' status:", res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
debug();
