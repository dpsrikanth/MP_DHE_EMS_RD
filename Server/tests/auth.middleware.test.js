const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_KEY = 'test-secret-key';
const { verifyToken, authorizeRole } = require('../middleware/auth.middleware');

// Minimal mock of an Express response that captures status + json.
function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

test('verifyToken: 401 when Authorization header is missing', () => {
  const req = { headers: {} };
  const res = mockRes();
  let nextCalled = false;
  verifyToken(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('verifyToken: 401 when token part is missing', () => {
  const req = { headers: { authorization: 'Bearer' } };
  const res = mockRes();
  verifyToken(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('verifyToken: 401 on invalid token (not 400)', () => {
  const req = { headers: { authorization: 'Bearer not-a-real-token' } };
  const res = mockRes();
  verifyToken(req, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('verifyToken: 401 "Session expired" on expired token', () => {
  const expired = jwt.sign({ id: 1 }, process.env.JWT_KEY, { expiresIn: -10 });
  const req = { headers: { authorization: `Bearer ${expired}` } };
  const res = mockRes();
  verifyToken(req, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.match(res.body.message, /expired/i);
});

test('verifyToken: calls next and sets req.user on a valid token', () => {
  const token = jwt.sign({ id: 7, role: 'faculty' }, process.env.JWT_KEY);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = mockRes();
  let nextCalled = false;
  verifyToken(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 7);
  assert.equal(req.user.role, 'faculty');
});

test('authorizeRole: 403 when role is not allowed', () => {
  const req = { user: { role: 'student' } };
  const res = mockRes();
  authorizeRole('superadmin')(req, res, () => {});
  assert.equal(res.statusCode, 403);
});

test('authorizeRole: calls next when role is allowed', () => {
  const req = { user: { role: 'superadmin' } };
  const res = mockRes();
  let nextCalled = false;
  authorizeRole('superadmin', 'university_admin')(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('authorizeRole: 403 when user/role info is missing', () => {
  const req = {};
  const res = mockRes();
  authorizeRole('superadmin')(req, res, () => {});
  assert.equal(res.statusCode, 403);
});
