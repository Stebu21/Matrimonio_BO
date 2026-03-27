const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');

exports.handler = async (event) => {
  const method = event.httpMethod;
  const idMatch = event.path.match(/\/guests\/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1]) : null;

  // GET /api/guests — public
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('guests')
      .select('id, nome, cognome, email, telefono, cellulare, gruppo, confermato, menu, indirizzo, cap, citta, provincia, tavolo, sesso, note')
      .order('cognome')
      .order('nome');
    if (error) return json({ error: error.message }, 500);
    return json(data);
  }

  // PATCH /api/guests/:id — public RSVP (solo confermato e note)
  if (method === 'PATCH' && id) {
    const body = JSON.parse(event.body || '{}');

    // Se l'utente e' admin, aggiorna tutti i campi; altrimenti solo RSVP
    if (verifyToken(event)) {
      const { error } = await supabase.from('guests').update(body).eq('id', id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // RSVP pubblico: solo confermato e note
    const update = {};
    if (body.confermato !== undefined) update.confermato = body.confermato;
    if (body.note !== undefined) update.note = body.note;
    if (Object.keys(update).length === 0) {
      return json({ error: 'Nessun campo da aggiornare' }, 400);
    }
    const { error } = await supabase.from('guests').update(update).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── Tutti i metodi sotto richiedono auth admin ──
  if (!verifyToken(event)) return unauthorized();

  // POST /api/guests — add one or batch
  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    if (Array.isArray(body)) {
      const rows = body.map(g => ({ nome: g.nome, cognome: g.cognome }));
      const { error } = await supabase.from('guests').insert(rows);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, count: rows.length });
    }
    const { data, error } = await supabase
      .from('guests')
      .insert({ nome: body.nome, cognome: body.cognome })
      .select('id')
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, id: data.id });
  }

  // DELETE /api/guests/:id
  if (method === 'DELETE' && id) {
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // DELETE /api/guests (all)
  if (method === 'DELETE') {
    const body = JSON.parse(event.body || '{}');
    if (!body.confirm) return json({ error: 'Conferma richiesta' }, 400);
    const { error } = await supabase.from('guests').delete().neq('id', 0);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
