const client = require('./db');

async function check() {
    try {
        const res = await client.query("SELECT * FROM users WHERE email = 'alokmalewar@gmail.com'");
        console.log("Users found:", res.rows.length);
        if (res.rows.length > 0) {
            console.log(res.rows[0]);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
