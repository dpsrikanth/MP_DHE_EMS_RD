const client = require('./db');

async function listStudents() {
    try {
        const res = await client.query('SELECT name, email, "deleteStatus" FROM public.students');
        console.table(res.rows);
        process.exit();
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

listStudents();
