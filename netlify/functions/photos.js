const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');
const multipart = require('parse-multipart-data');

const BUCKET = 'photos';

function getPublicUrl(filename) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

exports.handler = async (event) => {
  const method = event.httpMethod;
  const idMatch = event.path.match(/\/photos\/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1]) : null;

  // GET /api/photos — public
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('sort_order')
      .order('id');
    if (error) return json({ error: error.message }, 500);

    const photos = data.map(p => ({
      ...p,
      url: getPublicUrl(p.filename),
    }));
    return json(photos);
  }

  // ── Auth richiesta ──
  if (!verifyToken(event)) return unauthorized();

  // POST /api/photos — upload
  if (method === 'POST') {
    const contentType = event.headers['content-type'] || '';
    const boundary = multipart.getBoundary(contentType);
    if (!boundary) return json({ error: 'Content-Type non valido' }, 400);

    const body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    const parts = multipart.parse(body, boundary);

    const filePart = parts.find(p => p.name === 'photo');
    if (!filePart) return json({ error: 'Nessun file caricato' }, 400);

    // Validate mime type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(filePart.type)) {
      return json({ error: 'Tipo file non supportato' }, 400);
    }

    const ext = filePart.filename.split('.').pop();
    const filename = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, filePart.data, { contentType: filePart.type });

    if (uploadError) return json({ error: uploadError.message }, 500);

    // Get max sort_order
    const { data: maxRow } = await supabase
      .from('photos')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    const nextOrder = (maxRow ? maxRow.sort_order : 0) + 1;

    const captionPart = parts.find(p => p.name === 'caption');
    const caption = captionPart ? captionPart.data.toString() : '';

    const { data: inserted, error: dbError } = await supabase
      .from('photos')
      .insert({ filename, caption, sort_order: nextOrder })
      .select('id')
      .single();

    if (dbError) return json({ error: dbError.message }, 500);

    return json({
      ok: true,
      id: inserted.id,
      filename,
      url: getPublicUrl(filename),
    });
  }

  // PATCH /api/photos/:id
  if (method === 'PATCH' && id) {
    const body = JSON.parse(event.body || '{}');

    // If setting as hero, unset all others first
    if (body.is_hero) {
      await supabase.from('photos').update({ is_hero: 0 }).neq('id', 0);
      body.is_hero = 1;
    } else if (body.is_hero === false || body.is_hero === 0) {
      body.is_hero = 0;
    }

    const { error } = await supabase.from('photos').update(body).eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // DELETE /api/photos/:id
  if (method === 'DELETE' && id) {
    // Get filename to delete from storage
    const { data: photo } = await supabase
      .from('photos')
      .select('filename')
      .eq('id', id)
      .single();

    if (photo) {
      await supabase.storage.from(BUCKET).remove([photo.filename]);
    }

    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
