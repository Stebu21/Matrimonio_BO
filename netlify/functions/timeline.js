const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');

exports.handler = async (event) => {
  const method = event.httpMethod;
  const idMatch = event.path.match(/\/timeline\/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1]) : null;

  // GET /api/timeline — public
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('timeline')
      .select('*')
      .order('sort_order')
      .order('id');
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // ── Auth richiesta ──
  if (!verifyToken(event)) return unauthorized();

  // POST /api/timeline
  if (method === 'POST') {
    const { ora, titolo, descrizione } = JSON.parse(event.body || '{}');

    const { data: maxRow } = await supabase
      .from('timeline')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxRow ? maxRow.sort_order : 0) + 1;

    const { data, error } = await supabase
      .from('timeline')
      .insert({ ora, titolo, descrizione: descrizione || '', sort_order: nextOrder })
      .select('id')
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, id: data.id });
  }

  // PATCH /api/timeline/:id
  if (method === 'PATCH' && id) {
    const body = JSON.parse(event.body || '{}');
    const { error } = await supabase.from('timeline').update(body).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // DELETE /api/timeline/:id
  if (method === 'DELETE' && id) {
    const { error } = await supabase.from('timeline').delete().eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
