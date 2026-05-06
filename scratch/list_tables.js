const path = require('path');
const client = require(path.join(__dirname, '../Server/config/db'));
client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    .then(res => {
        console.log(res.rows.map(r => r.table_name).sort().join(', '));
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
