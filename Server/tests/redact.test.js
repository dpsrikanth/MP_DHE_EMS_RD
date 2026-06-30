const { test } = require('node:test');
const assert = require('node:assert/strict');
const { redactSensitive } = require('../utils/redact');

test('redacts top-level password', () => {
  const out = redactSensitive({ email: 'a@b.com', password: 'hunter2' });
  assert.equal(out.email, 'a@b.com');
  assert.equal(out.password, '[REDACTED]');
});

test('redacts case-insensitively and common credential keys', () => {
  const out = redactSensitive({ Password: 'x', Token: 'y', OTP: '1234', apiKey: 'k' });
  assert.equal(out.Password, '[REDACTED]');
  assert.equal(out.Token, '[REDACTED]');
  assert.equal(out.OTP, '[REDACTED]');
  assert.equal(out.apiKey, '[REDACTED]');
});

test('redacts nested objects and arrays', () => {
  const out = redactSensitive({
    user: { name: 'Asha', newPassword: 'secret' },
    sessions: [{ token: 'abc' }, { token: 'def' }],
  });
  assert.equal(out.user.name, 'Asha');
  assert.equal(out.user.newPassword, '[REDACTED]');
  assert.equal(out.sessions[0].token, '[REDACTED]');
  assert.equal(out.sessions[1].token, '[REDACTED]');
});

test('does not mutate the original object', () => {
  const input = { password: 'keep-me' };
  redactSensitive(input);
  assert.equal(input.password, 'keep-me');
});

test('passes through primitives and null/undefined safely', () => {
  assert.equal(redactSensitive('hello'), 'hello');
  assert.equal(redactSensitive(42), 42);
  assert.equal(redactSensitive(null), null);
  assert.equal(redactSensitive(undefined), undefined);
});
