// Mocking API logic for testing fixes

async function testApi() {
    const API_URL = 'http://localhost:8080/api';
    
    // We need a login token. Let's assume we can get one or the server is running.
    // Since I can't easily login without password, I'll check the database logic again or 
    // run a script that mocks the req.user object.
    
    const db = require('./db');
    
    try {
        // Mocking getPrograms logic for college_admin (role_name: 'college_admin', university_id: 6)
        const role = 'college_admin';
        const university_id = 6;
        
        const uId = (role === 'superadmin') ? null : ((role === 'university_admin' || role === 'college_admin') ? university_id : null);
        
        console.log("Mocking getPrograms with uId:", uId);
        
        if (uId) {
            const query = `SELECT p.id, p.name, p.duration_years, p.university_id, p.status 
                           FROM master_programs p 
                           JOIN university_master_programs ump ON p.id = ump.program_id 
                           WHERE ump.university_id = $1 AND (p.status IS NULL OR p.status = 'Active')`;
            const result = await db.query(query, [uId]);
            console.log("Programs result count:", result.rowCount);
            console.log("Programs sample:", result.rows.slice(0, 2));
        }

        // Mocking getRounds logic
        const college_id = 4; // Sample college ID
        const roundQuery = `
            SELECT id::text, name, 'custom' as type FROM internal_exam_rounds WHERE college_id = $1 AND status = true
            UNION
            SELECT component_name as id, component_name as name, 'structure' as type 
            FROM internal_marks_structure 
            WHERE college_id = $1
            ORDER BY name ASC
        `;
        const roundsRes = await db.query(roundQuery, [college_id]);
        console.log("Rounds result count:", roundsRes.rowCount);
        console.log("Rounds sample:", roundsRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

testApi();
