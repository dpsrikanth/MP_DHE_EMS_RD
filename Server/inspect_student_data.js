const client = require('./db');
async function run() {
    try {
        const res = await client.query("SELECT * FROM students LIMIT 1");
        if (res.rows.length > 0) {
            console.log("Students columns:", Object.keys(res.rows[0]));
            console.log("Sample student:", JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log("No students found in table.");
        }
        
        const users = await client.query("SELECT id, name, email FROM users LIMIT 1");
        console.log("Sample user:", JSON.stringify(users.rows[0], null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
