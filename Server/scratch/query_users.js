require('dotenv').config({ path: 'config/.env' });
const db = require('../config/db');

async function main() {
    try {
        console.log("=== Querying Master Roles ===");
        const roleRes = await db.query(`SELECT * FROM master_roles`);
        console.log(roleRes.rows);

        console.log("\n=== Master Teachers Table Columns ===");
        const colsRes = await db.query(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'master_teachers'`
        );
        console.log(colsRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

        console.log("\n=== Master Teachers For Sonal ===");
        const teacherRes = await db.query(
            `SELECT mt.*, md.designation_name 
             FROM master_teachers mt
             LEFT JOIN master_designations md ON mt.designation_id = md.id
             WHERE mt.user_id = 17`
        );
        console.log(teacherRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
main();
