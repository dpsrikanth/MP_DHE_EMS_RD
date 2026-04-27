const jwt = require('../node_modules/jsonwebtoken');

async function test() {
    const token = jwt.sign({ id: 16, role: 'HOD', department_id: 68, college_id: 10 }, '5c4cc4cb48e6538b71d47cd9e68ba9b0a1a0edbbbf8a7bde217d848698a834b6', {expiresIn: '24h'});
    const url = 'http://localhost:8080/api/college-admin/workflow-status?college_id=10&semester_id=16';
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);

