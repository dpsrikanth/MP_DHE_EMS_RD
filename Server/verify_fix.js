const fetch = require('node-fetch');

async function verify() {
    try {
        console.log('Testing Login for sriramkorla10@gmail.com...');
        const loginRes = await fetch('http://localhost:8080/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'sriramkorla10@gmail.com', password: 'password123' }) // Assuming a default password for testing
        });

        if (!loginRes.ok) {
            console.error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
            return;
        }

        const loginData = await loginRes.json();
        console.log('Login successful. Payload:');
        console.log(JSON.stringify(loginData.user, null, 2));

        const token = loginData.token;
        console.log('\nTesting Grading Config...');
        const configRes = await fetch('http://localhost:8080/api/grading/config', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!configRes.ok) {
            console.error(`Grading Config failed: ${configRes.status} ${await configRes.text()}`);
        } else {
            const configData = await configRes.json();
            console.log('Grading Config successful:');
            console.log(JSON.stringify(configData, null, 2));
        }

        console.log('\nTesting Student Results...');
        const resultsRes = await fetch('http://localhost:8080/api/student/results', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resultsRes.ok) {
            console.error(`Student Results failed: ${resultsRes.status} ${await resultsRes.text()}`);
        } else {
            const resultsData = await resultsRes.json();
            console.log(`Student Results successful. Count: ${resultsData.length}`);
        }

    } catch (err) {
        console.error('Verification error:', err);
    }
}

verify();
