const supabase = require('./_shared/supabase');

exports.handler = async () => {
  const { error } = await supabase.from('settings').select('key').limit(1);

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, ts: new Date().toISOString() })
  };
};

exports.config = {
  schedule: '0 */12 * * *'
};