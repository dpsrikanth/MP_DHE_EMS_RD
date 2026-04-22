const db = require('../../db');
(async () => {
    try {
        const query = `
            ALTER TABLE examination_halls 
            ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL;
        `;
        await db.query(query);
        console.log('Column exam_id added to examination_halls successfully.');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
})();
