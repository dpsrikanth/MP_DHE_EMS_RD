const db = require('./db');
db.query('SELECT NOW()').then(r => {
    console.log(r.rows);
    process.exit();
}).catch(e => {
    console.error(e);
    process.exit();
});
