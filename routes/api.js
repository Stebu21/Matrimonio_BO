const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const db = require('../db/database');

// ── Multer config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  }
});

// ══════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ══════════════════════════════════════

// Settings
router.get('/settings', (req, res) => {
  res.json(db.getAllSettings());
});

// Guests
router.get('/guests', (req, res) => {
  res.json(db.getGuests());
});

// Photos
router.get('/photos', (req, res) => {
  const photos = db.getPhotos().map(p => ({
    ...p,
    url: `/uploads/${p.filename}`
  }));
  res.json(photos);
});

// Timeline
router.get('/timeline', (req, res) => {
  res.json(db.getTimeline());
});

// Locations
router.get('/locations', (req, res) => {
  res.json(db.getLocations());
});

// RSVP — public PATCH for guest confirmation
router.patch('/guests/:id', (req, res) => {
  const { confermato, note } = req.body;
  const result = db.updateGuest(req.params.id, { confermato, note });
  if (!result) return res.status(400).json({ error: 'Nessun campo da aggiornare' });
  res.json({ ok: true });
});

// ══════════════════════════════════════
// ADMIN AUTH
// ══════════════════════════════════════

router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const settings = db.getAllSettings();
  const validUser = process.env.ADMIN_USER || 'sposi';
  const validPass = settings.admin_pass_override || process.env.ADMIN_PASS || 'sofia2026';

  if (username === validUser && password === validPass) {
    req.session.isAdmin = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: 'Credenziali non valide' });
  }
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

router.get('/admin/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ logged: true });
  } else {
    res.status(401).json({ logged: false });
  }
});

// ══════════════════════════════════════
// PROTECTED ADMIN ROUTES
// ══════════════════════════════════════

// Settings
router.post('/admin/settings', auth, (req, res) => {
  db.saveSettings(req.body);
  res.json({ ok: true });
});

// Change password
router.post('/admin/password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const settings = db.getAllSettings();
  const currentPass = settings.admin_pass_override || process.env.ADMIN_PASS || 'sofia2026';

  if (oldPassword !== currentPass) {
    return res.status(400).json({ error: 'Password attuale non corretta' });
  }
  db.saveSetting('admin_pass_override', newPassword);
  res.json({ ok: true });
});

// Guests — admin CRUD
router.post('/guests', auth, (req, res) => {
  const body = req.body;
  if (Array.isArray(body)) {
    const results = body.map(g => db.addGuest(g.nome, g.cognome));
    return res.json({ ok: true, count: results.length });
  }
  const result = db.addGuest(body.nome, body.cognome);
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.delete('/guests/:id', auth, (req, res) => {
  db.deleteGuest(req.params.id);
  res.json({ ok: true });
});

router.delete('/guests', auth, (req, res) => {
  if (!req.body.confirm) return res.status(400).json({ error: 'Conferma richiesta' });
  db.deleteAllGuests();
  res.json({ ok: true });
});

// Import from matrimonio.com (TSV format)
router.post('/guests/import-matrimoniocom', auth, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Nessun dato ricevuto' });

  const lines = data.split('\n').map(l => l.trimEnd()).filter(l => l);
  if (lines.length < 2) return res.status(400).json({ error: 'File vuoto o senza dati' });

  // Parse header to find column indices
  const header = lines[0].split('\t').map(h => h.trim().toUpperCase());
  const col = (name) => header.indexOf(name);

  const iNome = col('NOME');
  const iCognome = col('COGNOME');
  if (iNome === -1 || iCognome === -1) {
    return res.status(400).json({ error: 'Colonne NOME e COGNOME non trovate. Assicurati che il file sia nel formato di matrimonio.com' });
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

  let imported = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const nome = (cols[iNome] || '').trim();
    const cognome = (cols[iCognome] || '').trim();
    if (!nome || !cognome) continue;

    const confStr = iConfermato !== -1 ? (cols[iConfermato] || '').trim().toUpperCase() : '';
    const confermato = confStr === 'CONFERMATO' ? 1 : 0;

    db.addGuestFull({
      nome,
      cognome,
      email: iEmail !== -1 ? (cols[iEmail] || '').trim() : '',
      telefono: iTelefono !== -1 ? (cols[iTelefono] || '').trim() : '',
      cellulare: iCellulare !== -1 ? (cols[iCellulare] || '').trim() : '',
      gruppo: iGruppo !== -1 ? (cols[iGruppo] || '').trim() : '',
      confermato,
      menu: iMenu !== -1 ? (cols[iMenu] || '').trim() : '',
      indirizzo: iIndirizzo !== -1 ? (cols[iIndirizzo] || '').trim() : '',
      cap: iCap !== -1 ? (cols[iCap] || '').trim() : '',
      citta: iCitta !== -1 ? (cols[iCitta] || '').trim() : '',
      provincia: iProvincia !== -1 ? (cols[iProvincia] || '').trim() : '',
      tavolo: iTavolo !== -1 ? (cols[iTavolo] || '').trim() : '',
      sesso: iSesso !== -1 ? (cols[iSesso] || '').trim() : '',
    });
    imported++;
  }

  res.json({ ok: true, count: imported });
});

// Photos — admin CRUD
router.post('/photos', auth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
  const result = db.addPhoto(req.file.filename, req.body.caption || '');
  res.json({ ok: true, id: result.lastInsertRowid, filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

router.patch('/photos/:id', auth, (req, res) => {
  const result = db.updatePhoto(req.params.id, req.body);
  res.json({ ok: true });
});

router.delete('/photos/:id', auth, (req, res) => {
  const photo = db.getPhoto(req.params.id);
  if (photo) {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', photo.filename);
    try { fs.unlinkSync(filePath); } catch (e) { /* file may not exist */ }
  }
  db.deletePhoto(req.params.id);
  res.json({ ok: true });
});

// Timeline — admin CRUD
router.post('/timeline', auth, (req, res) => {
  const { ora, titolo, descrizione } = req.body;
  const result = db.addTimelineEvent(ora, titolo, descrizione);
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.patch('/timeline/:id', auth, (req, res) => {
  db.updateTimelineEvent(req.params.id, req.body);
  res.json({ ok: true });
});

router.delete('/timeline/:id', auth, (req, res) => {
  db.deleteTimelineEvent(req.params.id);
  res.json({ ok: true });
});

// Locations — admin CRUD
router.post('/locations', auth, (req, res) => {
  const { titolo, nome_luogo, indirizzo, maps_url, icona } = req.body;
  const result = db.addLocation(titolo, nome_luogo, indirizzo, maps_url, icona);
  res.json({ ok: true, id: result.lastInsertRowid });
});

router.patch('/locations/:id', auth, (req, res) => {
  db.updateLocation(req.params.id, req.body);
  res.json({ ok: true });
});

router.delete('/locations/:id', auth, (req, res) => {
  db.deleteLocation(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
