const http = require('http');

const postData = JSON.stringify({
  grade_scale: [{min: 90, grade: 'O', points: 10}],
  pass_threshold: 40,
  calculate_sgpa_on_earned_only: false,
  grace_policy: { is_enabled: true, max_total_grace: 5, max_per_subject_grace: 2 },
  targetUniversityId: 7
});

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/grading/config',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // Need a valid token. Or I'll just query the DB directly to see what happened.
  }
});
