const pool = require('../db.js');

async function fixConstraints() {
    try {
        console.log("Removing incorrect foreign keys...");
        await pool.query('ALTER TABLE academic_milestones DROP CONSTRAINT IF EXISTS academic_year_id_fkey');
        await pool.query('ALTER TABLE academic_milestones DROP CONSTRAINT IF EXISTS program_id_fkey');
        await pool.query('ALTER TABLE academic_milestones DROP CONSTRAINT IF EXISTS semester_id_fkey');

        console.log("Updating legacy milestones to Semester 1 (Context: BTech, 2024-2025)...");
        // IDs verified: Semester 1 (15), BTech (2), 2024-2025 (1)
        const res = await pool.query('UPDATE academic_milestones SET semester_id = 15, program_id = 2, academic_year_id = 1 WHERE semester_id IS NULL');
        console.log(`Updated ${res.rowCount} milestones`);

        console.log("Adding correct foreign keys to master tables...");
        await pool.query('ALTER TABLE academic_milestones ADD CONSTRAINT academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.master_academic_years(id) ON DELETE SET NULL');
        await pool.query('ALTER TABLE academic_milestones ADD CONSTRAINT program_id_fkey FOREIGN KEY (program_id) REFERENCES public.master_programs(id) ON DELETE SET NULL');
        await pool.query('ALTER TABLE academic_milestones ADD CONSTRAINT semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.master_semesters(id) ON DELETE SET NULL');

        console.log("Constraints and data fixed successfully.");
    } catch (err) {
        console.error("Error during fix:", err);
    } finally {
        pool.end();
    }
}

fixConstraints();

