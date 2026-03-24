const http = require('http');

const loginData = JSON.stringify({ email: 'anil.kumar@abc.com', password: 'password123' });

const loginOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const { token } = JSON.parse(body);
      console.log('Login successful');
      fetchDashboard(token);
    } else {
      console.error('Login failed:', body);
    }
  });
});

loginReq.on('error', (e) => console.error(e));
loginReq.write(loginData);
loginReq.end();

function fetchDashboard(token) {
  const dashOptions = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/paper-setter/chief/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const dashReq = http.request(dashOptions, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
      console.log('--- HOD Dashboard Data ---');
      console.log(body);
    });
  });

  dashReq.on('error', (e) => console.error(e));
  dashReq.end();
}
