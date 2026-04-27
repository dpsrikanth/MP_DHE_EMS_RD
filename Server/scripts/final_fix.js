const pool = require('../db.js');

async function fixEverything() {
    try {
        console.log("Fetching all foreign key names for academic_milestones...");
        const fkRes = await pool.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'academic_milestones' AND constraint_type = 'FOREIGN KEY'
        `);
        
        for (const row of fkRes.rows) {
            console.log(`Dropping constraint: ${row.constraint_name}`);
            await pool.query(`ALTER TABLE academic_milestones DROP CONSTRAINT "${row.constraint_name}"`);
        }

        console.log("Updating all legacy milestones to Semester 1 (Context: BTech, 2024-2025)...");
        // Semester 1: 15, BTech: 2, 2024-2025: 1
        const updateRes = await pool.query('UPDATE academic_milestones SET semester_id = 15, program_id = 2, academic_year_id = 1');
        console.log(`Updated ${updateRes.rowCount} milestones`);

        console.log("Adding correct foreign keys to master tables...");
        await pool.query('ALTER TABLE academic_milestones ADD CONSTRAINT fk_milestones_academic_year FOREIGN KEY (academic_year_id) REFERENCES public.master_academic_years(id) ON DELETE SET NULL');
        await pool.query('ALTER TABLE academic_milestones ADD CONSTRAINT fk_milestones_program FOREIGN KEY (program_id) REFERENCES public.master_programs(id) ON DELETE SET NULL');
        await pool.query('ALTER TABLE academic_milestones ADD CONSTRAINT fk_milestones_semester FOREIGN KEY (semester_id) REFERENCES public.master_semesters(id) ON DELETE SET NULL');

        console.log("Data and constraints fixed successfully.");
    } catch (err) {
        console.error("Critical error:", err);
    } finally {
        pool.end();
    }
}

fixEverything();

