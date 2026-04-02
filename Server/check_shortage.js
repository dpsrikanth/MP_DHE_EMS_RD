const client = require('./db');
async function run() {
    try {
        // Get MP UNIVERSITY's id
        const mpUni = await client.query(`SELECT id, name FROM colleges WHERE name ILIKE 'MP UNIVERSITY'`);
        console.log('MP UNIVERSITY:', mpUni.rows);

        if (mpUni.rows.length === 0) {
            console.log('MP UNIVERSITY not found! Available colleges:');
            const all = await client.query(`SELECT id, name FROM colleges ORDER BY id`);
            all.rows.forEach(r => console.log(r));
            return;
        }

        const mpUniId = mpUni.rows[0].id;

        // Fix shortage_request id=5: set college_id to MP UNIVERSITY
        const fix = await client.query(
            `UPDATE shortage_requests SET college_id = $1 WHERE id = 5 RETURNING *`,
            [mpUniId]
        );
        console.log('Fixed record:', fix.rows[0]);
    } catch(e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
}
run();
