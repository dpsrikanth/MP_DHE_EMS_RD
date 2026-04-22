const fetch = require('node-fetch');

async function testHODDashboard() {
  const loginUrl = 'http://localhost:8080/api/login';
  const dashboardUrl = 'http://localhost:8080/api/paper-setter/chief/dashboard';
  
  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'Anilkumar@gmail.com', password: 'password123' })
    });
    
    if (!loginRes.ok) throw new Error('Login failed');
    const { token } = await loginRes.json();
    console.log('Login successful');

    const dashRes = await fetch(dashboardUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (dashRes.ok) {
      const data = await dashRes.json();
      console.log('--- HOD Dashboard Data ---');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('Fetch failed:', await dashRes.text());
    }

  } catch (err) {
    console.error(err);
  }
}

testHODDashboard();
