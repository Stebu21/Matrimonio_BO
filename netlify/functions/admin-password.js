const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if (!verifyToken(event)) return unauthorized();

  const { oldPassword, newPassword } = JSON.parse(event.body || '{}');

  // Check current password
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'admin_pass_override')
    .single();

  const currentPass = (data && data.value) || process.env.ADMIN_PASS || 'sofia2026';

  if (oldPassword !== currentPass) {
    return json({ error: 'Password attuale non corretta' }, 400);
  }

  await supabase.from('settings').upsert(
    { key: 'admin_pass_override', value: newPassword },
    { onConflict: 'key' }
  );

  return json({ ok: true });
};
