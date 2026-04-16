const db = require('./db');
(async () => {
    try {
        console.log("--- Hall Details ---");
        const hallRes = await db.query(`SELECT id, hall_code, college_id FROM examination_halls WHERE hall_code = 'HALL-A'`);
        console.log(hallRes.rows);

        if (hallRes.rows.length > 0) {
            const hallId = hallRes.rows[0].id;
            console.log(`--- Seating for Hall ID ${hallId} ---`);
            const seatingRes = await db.query(`
                SELECT exam_id, COUNT(*) 
                FROM seating_arrangements 
                WHERE hall_id = $1 
                GROUP BY exam_id
            `, [hallId]);
            console.log(seatingRes.rows);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
