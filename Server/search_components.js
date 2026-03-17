const client = require('./db');

async function run() {
    try {
        const res = await client.query(`
            SELECT * FROM internal_marks_structure 
            WHERE component_name ILIKE '%Lab%' 
            OR component_name ILIKE '%Viva%'
            OR component_name ILIKE '%External%'
        `);
        console.log("--- FOUND COMPONENTS ---");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
