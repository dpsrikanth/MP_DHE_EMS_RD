const client = require('../../db');

async function check() {
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'marks'
        `);
        console.log("--- MARKS COLUMNS ---");
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        console.log("--- END MARKS COLUMNS ---");
        
        const erRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'exam_registrations'
        `);
        console.log("--- ER COLUMNS ---");
        erRes.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        console.log("--- END ER COLUMNS ---");

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

check();
