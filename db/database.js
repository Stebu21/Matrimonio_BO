const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'matrimonio.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

function init() {
  // Create uploads directory
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS guests (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      cognome    TEXT NOT NULL,
      email      TEXT DEFAULT '',
      telefono   TEXT DEFAULT '',
      cellulare  TEXT DEFAULT '',
      gruppo     TEXT DEFAULT '',
      confermato INTEGER DEFAULT 0,
      menu       TEXT DEFAULT '',
      indirizzo  TEXT DEFAULT '',
      cap        TEXT DEFAULT '',
      citta      TEXT DEFAULT '',
      provincia  TEXT DEFAULT '',
      tavolo     TEXT DEFAULT '',
      sesso      TEXT DEFAULT '',
      note       TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS photos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT NOT NULL,
      caption    TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_hero    INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS timeline (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ora         TEXT NOT NULL,
      titolo      TEXT NOT NULL,
      descrizione TEXT DEFAULT '',
      sort_order  INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS locations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo      TEXT NOT NULL,
      nome_luogo  TEXT NOT NULL,
      indirizzo   TEXT DEFAULT '',
      maps_url    TEXT DEFAULT '',
      icona       TEXT DEFAULT '📍',
      sort_order  INTEGER DEFAULT 0
    );
  `);

  // Seed settings if empty
  const settingsCount = db.prepare('SELECT COUNT(*) as c FROM settings').get().c;
  if (settingsCount === 0) {
    const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    const seedSettings = db.transaction((entries) => {
      for (const [key, value] of entries) {
        insert.run(key, value);
      }
    });
    seedSettings([
      ['sposi_nome1', 'Sofia'],
      ['sposi_nome2', 'Stefano'],
      ['cognome1', 'Macchi'],
      ['cognome2', 'Bulgheroni'],
      ['data_matrimonio', '2026-10-03T11:30:00'],
      ['data_display', '3 \u00b7 Ottobre \u00b7 2026'],
      ['location_display', 'Villa Morotti, Daverio (VA)'],
      ['hero_pretitle', 'Ci sposiamo'],
      ['storia_label', 'La nostra storia'],
      ['storia_title', 'Un s\u00ec che aspettavamo da sempre'],
      ['storia_testo', 'Dopo anni di avventure condivise, risate, viaggi e piccole quotidianit\u00e0 che sono diventate il nostro mondo, abbiamo deciso di celebrare il nostro amore circondati dalle persone a cui vogliamo bene. Il 3 ottobre 2026 sar\u00e0 il giorno in cui prometteremo di camminare insieme per sempre.'],
      ['programma_label', 'Il grande giorno'],
      ['programma_title', 'Come si svolger\u00e0 la giornata'],
      ['location_label', 'Dove siamo'],
      ['location_title', 'La location'],
      ['regalo_label', 'Lista nozze'],
      ['regalo_title', 'Un pensiero per noi'],
      ['regalo_testo', 'La vostra presenza \u00e8 il regalo pi\u00f9 bello. Per chi volesse farci un dono, qui trovate i nostri riferimenti bancari.'],
      ['regalo_intestatario', 'Sofia Macchi e Stefano Bulgheroni'],
      ['regalo_iban', 'IT00 X000 0000 0000 0000 0000 000'],
      ['regalo_note', 'Su mobile puoi tenere premuto sul testo per copiarlo direttamente.'],
      ['rsvp_label', 'Conferma la tua presenza'],
      ['rsvp_title', 'Ci sei?'],
      ['rsvp_testo', 'Seleziona il tuo nome dall\u2019elenco e lasciaci un messaggio \u2014 intolleranze, allergie o qualsiasi cosa vogliamo sapere per farti stare al meglio.'],
      ['footer_testo', 'Con amore \u00b7 3 Ottobre 2026'],
      ['carousel_visibile', '1'],
    ]);
  }

  // Seed timeline if empty
  const timelineCount = db.prepare('SELECT COUNT(*) as c FROM timeline').get().c;
  if (timelineCount === 0) {
    const insert = db.prepare('INSERT INTO timeline (ora, titolo, descrizione, sort_order) VALUES (?, ?, ?, ?)');
    const seed = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
    seed([
      ['11:30', 'Cerimonia', 'Villa Morotti, Daverio (VA)', 1],
      ['13:30', 'Cocktail', 'Giardini di Villa Morotti', 2],
      ['15:00', 'Ricevimento', 'Pranzo in sala', 3],
      ['20:00', 'Festa', 'Musica e brindisi fino a tarda notte', 4],
    ]);
  }

  // Seed locations if empty
  const locCount = db.prepare('SELECT COUNT(*) as c FROM locations').get().c;
  if (locCount === 0) {
    const insert = db.prepare('INSERT INTO locations (titolo, nome_luogo, indirizzo, maps_url, icona, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
    const seed = db.transaction((rows) => { for (const r of rows) insert.run(...r); });
    seed([
      ['La cerimonia', 'Villa Morotti', 'Daverio (VA) 21020', 'https://maps.app.goo.gl/gKYQmtJgVz2rcHka9', '\ud83c\udfdb\ufe0f', 1],
      ['Il ricevimento', 'Villa Morotti', 'Daverio (VA) 21020', 'https://maps.google.com/?q=Villa+Morotti+Daverio+VA', '\ud83c\udfdb\ufe0f', 2],
    ]);
  }

  console.log('Database inizializzato con successo');
}

// ── Query helpers ──

// Settings
function getAllSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  for (const r of rows) obj[r.key] = r.value;
  return obj;
}

function saveSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function saveSettings(obj) {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) stmt.run(k, v);
  });
  tx(Object.entries(obj));
}

// Guests
function getGuests() {
  return db.prepare('SELECT id, nome, cognome, email, telefono, cellulare, gruppo, confermato, menu, indirizzo, cap, citta, provincia, tavolo, sesso, note FROM guests ORDER BY cognome, nome').all();
}

function addGuest(nome, cognome) {
  return db.prepare('INSERT INTO guests (nome, cognome) VALUES (?, ?)').run(nome, cognome);
}

function addGuestFull(g) {
  return db.prepare(
    'INSERT INTO guests (nome, cognome, email, telefono, cellulare, gruppo, confermato, menu, indirizzo, cap, citta, provincia, tavolo, sesso, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    g.nome, g.cognome, g.email || '', g.telefono || '', g.cellulare || '',
    g.gruppo || '', g.confermato || 0, g.menu || '', g.indirizzo || '',
    g.cap || '', g.citta || '', g.provincia || '', g.tavolo || '', g.sesso || '', g.note || ''
  );
}

function updateGuest(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.confermato !== undefined) { sets.push('confermato = ?'); vals.push(fields.confermato); }
  if (fields.note !== undefined) { sets.push('note = ?'); vals.push(fields.note); }
  if (fields.nome !== undefined) { sets.push('nome = ?'); vals.push(fields.nome); }
  if (fields.cognome !== undefined) { sets.push('cognome = ?'); vals.push(fields.cognome); }
  if (fields.email !== undefined) { sets.push('email = ?'); vals.push(fields.email); }
  if (fields.telefono !== undefined) { sets.push('telefono = ?'); vals.push(fields.telefono); }
  if (fields.cellulare !== undefined) { sets.push('cellulare = ?'); vals.push(fields.cellulare); }
  if (fields.gruppo !== undefined) { sets.push('gruppo = ?'); vals.push(fields.gruppo); }
  if (fields.menu !== undefined) { sets.push('menu = ?'); vals.push(fields.menu); }
  if (fields.indirizzo !== undefined) { sets.push('indirizzo = ?'); vals.push(fields.indirizzo); }
  if (fields.cap !== undefined) { sets.push('cap = ?'); vals.push(fields.cap); }
  if (fields.citta !== undefined) { sets.push('citta = ?'); vals.push(fields.citta); }
  if (fields.provincia !== undefined) { sets.push('provincia = ?'); vals.push(fields.provincia); }
  if (fields.tavolo !== undefined) { sets.push('tavolo = ?'); vals.push(fields.tavolo); }
  if (fields.sesso !== undefined) { sets.push('sesso = ?'); vals.push(fields.sesso); }
  if (sets.length === 0) return null;
  vals.push(id);
  return db.prepare(`UPDATE guests SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

function deleteGuest(id) {
  return db.prepare('DELETE FROM guests WHERE id = ?').run(id);
}

function deleteAllGuests() {
  return db.prepare('DELETE FROM guests').run();
}

// Photos
function getPhotos() {
  return db.prepare('SELECT * FROM photos ORDER BY sort_order, id').all();
}

function addPhoto(filename, caption) {
  return db.prepare('INSERT INTO photos (filename, caption, sort_order) VALUES (?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM photos))').run(filename, caption || '');
}

function updatePhoto(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.caption !== undefined) { sets.push('caption = ?'); vals.push(fields.caption); }
  if (fields.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(fields.sort_order); }
  if (fields.is_hero !== undefined) {
    // If setting as hero, unset all others first
    if (fields.is_hero) {
      db.prepare('UPDATE photos SET is_hero = 0').run();
    }
    sets.push('is_hero = ?');
    vals.push(fields.is_hero ? 1 : 0);
  }
  if (sets.length === 0) return null;
  vals.push(id);
  return db.prepare(`UPDATE photos SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

function getPhoto(id) {
  return db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
}

function deletePhoto(id) {
  return db.prepare('DELETE FROM photos WHERE id = ?').run(id);
}

// Timeline
function getTimeline() {
  return db.prepare('SELECT * FROM timeline ORDER BY sort_order, id').all();
}

function addTimelineEvent(ora, titolo, descrizione) {
  return db.prepare('INSERT INTO timeline (ora, titolo, descrizione, sort_order) VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM timeline))').run(ora, titolo, descrizione || '');
}

function updateTimelineEvent(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.ora !== undefined) { sets.push('ora = ?'); vals.push(fields.ora); }
  if (fields.titolo !== undefined) { sets.push('titolo = ?'); vals.push(fields.titolo); }
  if (fields.descrizione !== undefined) { sets.push('descrizione = ?'); vals.push(fields.descrizione); }
  if (fields.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(fields.sort_order); }
  if (sets.length === 0) return null;
  vals.push(id);
  return db.prepare(`UPDATE timeline SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

function deleteTimelineEvent(id) {
  return db.prepare('DELETE FROM timeline WHERE id = ?').run(id);
}

// Locations
function getLocations() {
  return db.prepare('SELECT * FROM locations ORDER BY sort_order, id').all();
}

function addLocation(titolo, nome_luogo, indirizzo, maps_url, icona) {
  return db.prepare('INSERT INTO locations (titolo, nome_luogo, indirizzo, maps_url, icona, sort_order) VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM locations))').run(titolo, nome_luogo, indirizzo || '', maps_url || '', icona || '\ud83d\udccd');
}

function updateLocation(id, fields) {
  const sets = [];
  const vals = [];
  if (fields.titolo !== undefined) { sets.push('titolo = ?'); vals.push(fields.titolo); }
  if (fields.nome_luogo !== undefined) { sets.push('nome_luogo = ?'); vals.push(fields.nome_luogo); }
  if (fields.indirizzo !== undefined) { sets.push('indirizzo = ?'); vals.push(fields.indirizzo); }
  if (fields.maps_url !== undefined) { sets.push('maps_url = ?'); vals.push(fields.maps_url); }
  if (fields.icona !== undefined) { sets.push('icona = ?'); vals.push(fields.icona); }
  if (fields.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(fields.sort_order); }
  if (sets.length === 0) return null;
  vals.push(id);
  return db.prepare(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
}

function deleteLocation(id) {
  return db.prepare('DELETE FROM locations WHERE id = ?').run(id);
}

module.exports = {
  db, init,
  getAllSettings, saveSetting, saveSettings,
  getGuests, addGuest, addGuestFull, updateGuest, deleteGuest, deleteAllGuests,
  getPhotos, addPhoto, updatePhoto, getPhoto, deletePhoto,
  getTimeline, addTimelineEvent, updateTimelineEvent, deleteTimelineEvent,
  getLocations, addLocation, updateLocation, deleteLocation,
};
