const jwt = require('jsonwebtoken');
const cookie = require('cookie');

const SECRET = () => process.env.SESSION_SECRET || 'matrimonio-secret-2026';
const COOKIE_NAME = 'session_token';

function signToken() {
  return jwt.sign({ isAdmin: true }, SECRET(), { expiresIn: '24h' });
}

function verifyToken(event) {
  const cookies = cookie.parse(event.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, SECRET());
    return decoded.isAdmin === true;
  } catch {
    return false;
  }
}

function setCookie(token) {
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  });
}

function clearCookie() {
  return cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 0,
  });
}

function unauthorized() {
  return { statusCode: 401, body: JSON.stringify({ error: 'Non autorizzato' }) };
}

function json(data, statusCode = 200, headers = {}) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  };
}

module.exports = { signToken, verifyToken, setCookie, clearCookie, unauthorized, json, COOKIE_NAME };
