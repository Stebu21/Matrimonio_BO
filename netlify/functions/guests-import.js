const supabase = require('./_shared/supabase');
const { verifyToken, unauthorized, json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if (!verifyToken(event)) return unauthorized();

  const { data: tsvData } = JSON.parse(event.body || '{}');
  if (!tsvData) return json({ error: 'Nessun dato ricevuto' }, 400);

  const lines = tsvData.split('\n').map(l => l.trimEnd()).filter(l => l);
  if (lines.length < 2) return json({ error: 'File vuoto o senza dati' }, 400);

  const header = lines[0].split('\t').map(h => h.trim().toUpperCase());
  const col = (name) => header.indexOf(name);

  const iNome = col('NOME');
  const iCognome = col('COGNOME');
  if (iNome === -1 || iCognome === -1) {
    return json({ error: 'Colonne NOME e COGNOME non trovate. Assicurati che il file sia nel formato di matrimonio.com' }, 400);
  }

  const iEmail = col('EMAIL');
  const iTelefono = col('TELEFONO');
  const iCellulare = header.findIndex(h => h.includes('CELLULARE'));
  const iGruppo = col('GRUPPO');
  const iConfermato = col('CONFERMATO');
  const iMenu = header.findIndex(h => h.includes('MEN'));
  const iIndirizzo = col('INDIRIZZO');
  const iCap = col('CAP');
  const iCitta = header.findIndex(h => h.includes('CITT'));
  const iProvincia = col('PROVINCIA');
  const iTavolo = col('TAVOLO');
  const iSesso = col('SESSO');

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const nome = (cols[iNome] || '').trim();
    const cognome = (cols[iCognome] || '').trim();
    if (!nome || !cognome) continue;

    const confStr = iConfermato !== -1 ? (cols[iConfermato] || '').trim().toUpperCase() : '';

    rows.push({
      nome,
      cognome,
      email: iEmail !== -1 ? (cols[iEmail] || '').trim() : '',
      telefono: iTelefono !== -1 ? (cols[iTelefono] || '').trim() : '',
      cellulare: iCellulare !== -1 ? (cols[iCellulare] || '').trim() : '',
      gruppo: iGruppo !== -1 ? (cols[iGruppo] || '').trim() : '',
      confermato: confStr === 'CONFERMATO' ? 1 : 0,
      menu: iMenu !== -1 ? (cols[iMenu] || '').trim() : '',
      indirizzo: iIndirizzo !== -1 ? (cols[iIndirizzo] || '').trim() : '',
      cap: iCap !== -1 ? (cols[iCap] || '').trim() : '',
      citta: iCitta !== -1 ? (cols[iCitta] || '').trim() : '',
      provincia: iProvincia !== -1 ? (cols[iProvincia] || '').trim() : '',
      tavolo: iTavolo !== -1 ? (cols[iTavolo] || '').trim() : '',
      sesso: iSesso !== -1 ? (cols[iSesso] || '').trim() : '',
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('guests').insert(rows);
    if (error) return json({ error: error.message }, 500);
  }

  return json({ ok: true, count: rows.length });
};
