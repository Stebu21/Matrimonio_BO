const { clearCookie, json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return json({ ok: true }, 200, {
    'Set-Cookie': clearCookie(),
  });
};
