const client = require('./db');

async function seedStudent() {
    try {
        console.log("Simulating Admin Action: Pre-authorizing student...");
        
        // Ensure Alok exists in the students table
        const res = await client.query("SELECT * FROM students WHERE email = 'alokmalewar@gmail.com'");
        if (res.rows.length === 0) {
            await client.query(`
                INSERT INTO public.students (
                    name, email, "collageName", "deleteStatus"
                ) VALUES (
                    'Alok Malewar', 'alokmalewar@gmail.com', 'Govt. Model Science College, Jabalpur', true
                )
            `);
            console.log("SUCCESS: Inserted 'alokmalewar@gmail.com' into the 'students' table.");
        } else {
            // Fix deleteStatus just in case it was false
            await client.query(`UPDATE public.students SET "deleteStatus" = true WHERE email = 'alokmalewar@gmail.com'`);
            console.log("SUCCESS: 'alokmalewar@gmail.com' already exists in the 'students' table, ensured status is active.");
        }
        
        process.exit();
    } catch(err) {
        console.error("Failed to seed student:", err);
        process.exit(1);
    }
}

seedStudent();
