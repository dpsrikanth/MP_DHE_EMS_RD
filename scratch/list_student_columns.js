const path = require('path');
const client = require(path.join(__dirname, '../Server/config/db'));
client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'")
    .then(res => {
        console.log(res.rows.map(r => r.column_name).sort().join(', '));
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
