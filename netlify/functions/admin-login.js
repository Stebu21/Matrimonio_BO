const supabase = require('./_shared/supabase');
const { signToken, setCookie, json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { username, password } = JSON.parse(event.body || '{}');
  const validUser = process.env.ADMIN_USER || 'sposi';

  // Check for password override in DB
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'admin_pass_override')
    .single();

  const validPass = (data && data.value) || process.env.ADMIN_PASS || 'sofia2026';

  if (username === validUser && password === validPass) {
    const token = signToken();
    return json({ ok: true }, 200, {
      'Set-Cookie': setCookie(token),
    });
  }

  return json({ error: 'Credenziali non valide' }, 401);
};
