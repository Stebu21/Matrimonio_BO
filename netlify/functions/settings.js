const supabase = require('./_shared/supabase');
const { json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) return json({ error: error.message }, 500);

  const obj = {};
  for (const r of data) obj[r.key] = r.value;
  return json(obj);
};
