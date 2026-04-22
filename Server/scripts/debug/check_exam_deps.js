const pool = require('../../Server/db');

async function findExamDependencies() {
    try {
        const examId = 78;
        console.log(`Checking dependencies for Exam ID: ${examId}`);

        const tablesQuery = `
            SELECT 
                tc.table_name, 
                kcu.column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='exams';
        `;
        
        const { rows } = await pool.query(tablesQuery);
        console.log("Found dependent tables:");
        for (const row of rows) {
            const countRes = await pool.query(`SELECT COUNT(*) FROM ${row.table_name} WHERE ${row.column_name} = $1`, [examId]);
            console.log(`- ${row.table_name} (${row.column_name}): ${countRes.rows[0].count} records`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        pool.end();
    }
}

findExamDependencies();
