const client = require('./db');

async function addStudent() {
    try {
        await client.query(`
            INSERT INTO public.students (
                name, email, "collageName", "deleteStatus"
            ) VALUES (
                'Sanjana C Gowda', 'sanjanacgowda609@gmail.com', 'Govt. Model Science College, Jabalpur', true
            )
        `);
        console.log("SUCCESS: Inserted 'sanjanacgowda609@gmail.com' into the 'students' table.");
        process.exit();
    } catch(err) {
        console.error("Failed to insert student:", err);
        process.exit(1);
    }
}

addStudent();
