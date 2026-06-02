const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'replace-me-with-a-secure-secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
