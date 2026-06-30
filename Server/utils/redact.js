// Utility to strip sensitive values out of objects before they reach the logs.

// Keys whose values must never be logged (credentials, tokens, OTPs, secrets).
const SENSITIVE_KEYS = new Set([
  'password', 'currentpassword', 'newpassword', 'confirmpassword', 'oldpassword',
  'token', 'accesstoken', 'refreshtoken', 'authorization', 'otp', 'secret',
  'jwt', 'apikey', 'api_key', 'pass', 'pwd'
]);

// Recursively replace sensitive values with [REDACTED]. Returns a safe copy and
// never mutates the input. Depth-bounded so a circular/huge object can't hang it.
const redactSensitive = (value, depth = 0) => {
  if (value === null || value === undefined || depth > 6) return value;
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : redactSensitive(v, depth + 1);
    }
    return out;
  }
  return value;
};

module.exports = { redactSensitive, SENSITIVE_KEYS };
