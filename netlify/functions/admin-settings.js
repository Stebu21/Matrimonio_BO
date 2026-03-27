const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if (!verifyToken(event)) return unauthorized();

  const body = JSON.parse(event.body || '{}');
  const entries = Object.entries(body);

  for (const [key, value] of entries) {
    await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  }

  return json({ ok: true });
};
