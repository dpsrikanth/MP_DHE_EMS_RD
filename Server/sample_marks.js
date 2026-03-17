const client = require('./db');

async function run() {
    try {
        const res = await client.query(`
            SELECT * FROM marks 
            WHERE external_marks IS NOT NULL 
            LIMIT 5
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
