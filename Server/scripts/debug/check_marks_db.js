const pool = require('../../db');

async function run() {
    try {
        const query = `
            SELECT al.id, al.action, al.entity_type, al.entity_id, al.created_at, al.old_values, al.new_values, u.name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 10;
        `;
        const res = await pool.query(query);
        console.log("Recent audit logs:");
        console.table(res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
