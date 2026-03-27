const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');

exports.handler = async (event) => {
  const method = event.httpMethod;
  const idMatch = event.path.match(/\/locations\/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1]) : null;

  // GET /api/locations — public
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('sort_order')
      .order('id');
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // ── Auth richiesta ──
  if (!verifyToken(event)) return unauthorized();

  // POST /api/locations
  if (method === 'POST') {
    const { titolo, nome_luogo, indirizzo, maps_url, icona } = JSON.parse(event.body || '{}');

    const { data: maxRow } = await supabase
      .from('locations')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxRow ? maxRow.sort_order : 0) + 1;

    const { data, error } = await supabase
      .from('locations')
      .insert({
        titolo,
        nome_luogo,
        indirizzo: indirizzo || '',
        maps_url: maps_url || '',
        icona: icona || '📍',
        sort_order: nextOrder,
      })
      .select('id')
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, id: data.id });
  }

  // PATCH /api/locations/:id
  if (method === 'PATCH' && id) {
    const body = JSON.parse(event.body || '{}');
    const { error } = await supabase.from('locations').update(body).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // DELETE /api/locations/:id
  if (method === 'DELETE' && id) {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
