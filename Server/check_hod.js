require('dotenv').config({ path: './config/.env' });
const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
pool.query("SELECT DISTINCT name FROM academic_milestones WHERE name ILIKE '%HOD%'").then(res => {
    console.log(JSON.stringify(res.rows, null, 2));
    pool.end();
}).catch(err => {
    console.error(err);
    pool.end();
});
