-- =============================================
-- Matrimonio Web — Supabase (PostgreSQL) Schema
-- =============================================
-- Eseguire in Supabase SQL Editor per creare
-- tabelle, RLS policies e dati di default.
-- =============================================

-- 1. Tabelle

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS guests (
  id         SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id         SERIAL PRIMARY KEY,
  filename   TEXT NOT NULL,
  caption    TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_hero    INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline (
  id          SERIAL PRIMARY KEY,
  ora         TEXT NOT NULL,
  titolo      TEXT NOT NULL,
  descrizione TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  titolo      TEXT NOT NULL,
  nome_luogo  TEXT NOT NULL,
  indirizzo   TEXT DEFAULT '',
  descrizione TEXT DEFAULT '',
  maps_url    TEXT DEFAULT '',
  icona       TEXT DEFAULT '📍',
  sort_order  INTEGER DEFAULT 0
);

-- 2. RLS (Row Level Security)
--    Le funzioni Netlify usano la service_role key che bypassa RLS.
--    Abilitiamo RLS e aggiungiamo policy di sola lettura per anon,
--    cosi' il DB e' protetto anche se qualcuno usa la anon key.

ALTER TABLE settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline  ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Anon puo' leggere tutto (dati pubblici del sito)
CREATE POLICY "anon_read_settings"  ON settings  FOR SELECT USING (true);
CREATE POLICY "anon_read_guests"    ON guests    FOR SELECT USING (true);
CREATE POLICY "anon_read_photos"    ON photos    FOR SELECT USING (true);
CREATE POLICY "anon_read_timeline"  ON timeline  FOR SELECT USING (true);
CREATE POLICY "anon_read_locations" ON locations  FOR SELECT USING (true);

-- Anon puo' aggiornare solo confermato e note (RSVP pubblico)
CREATE POLICY "anon_rsvp_guests" ON guests
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- 3. Storage bucket per le foto
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: chiunque puo' leggere le foto (bucket pubblico)
CREATE POLICY "public_read_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

-- Policy: solo service_role puo' inserire/eliminare (gestito dal backend)
CREATE POLICY "service_insert_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "service_delete_photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'photos');

-- 4. Dati di default (seed)

INSERT INTO settings (key, value) VALUES
  ('sposi_nome1',       'Sofia'),
  ('sposi_nome2',       'Stefano'),
  ('cognome1',          'Macchi'),
  ('cognome2',          'Bulgheroni'),
  ('data_matrimonio',   '2026-10-03T11:30:00'),
  ('data_display',      '3 · Ottobre · 2026'),
  ('location_display',  'Villa Morotti, Daverio (VA)'),
  ('hero_pretitle',     'Ci sposiamo'),
  ('storia_label',      'La nostra storia'),
  ('storia_title',      'Un sì che aspettavamo da sempre'),
  ('storia_testo',      'Dopo anni di avventure condivise, risate, viaggi e piccole quotidianità che sono diventate il nostro mondo, abbiamo deciso di celebrare il nostro amore circondati dalle persone a cui vogliamo bene. Il 3 ottobre 2026 sarà il giorno in cui prometteremo di camminare insieme per sempre.'),
  ('programma_label',   'Il grande giorno'),
  ('programma_title',   'Come si svolgerà la giornata'),
  ('location_label',    'Dove siamo'),
  ('location_title',    'La location'),
  ('regalo_label',      'Lista nozze'),
  ('regalo_title',      'Un pensiero per noi'),
  ('regalo_testo',      'La vostra presenza è il regalo più bello. Per chi volesse farci un dono, qui trovate i nostri riferimenti bancari.'),
  ('regalo_intestatario','Sofia Macchi e Stefano Bulgheroni'),
  ('regalo_iban',       'IT00 X000 0000 0000 0000 0000 000'),
  ('regalo_note',       'Su mobile puoi tenere premuto sul testo per copiarlo direttamente.'),
  ('rsvp_label',        'Conferma la tua presenza'),
  ('rsvp_title',        'Ci sei?'),
  ('rsvp_testo',        'Seleziona il tuo nome dall''elenco e lasciaci un messaggio — intolleranze, allergie o qualsiasi cosa vogliamo sapere per farti stare al meglio.'),
  ('footer_testo',      'Con amore · 3 Ottobre 2026'),
  ('carousel_visibile', '1')
ON CONFLICT (key) DO NOTHING;

INSERT INTO timeline (ora, titolo, descrizione, sort_order) VALUES
  ('11:30', 'Cerimonia',   'Villa Morotti, Daverio (VA)',         1),
  ('13:30', 'Cocktail',    'Giardini di Villa Morotti',           2),
  ('15:00', 'Ricevimento', 'Pranzo in sala',                      3),
  ('20:00', 'Festa',       'Musica e brindisi fino a tarda notte', 4)
ON CONFLICT DO NOTHING;

INSERT INTO locations (titolo, nome_luogo, indirizzo, maps_url, icona, sort_order) VALUES
  ('La cerimonia',  'Villa Morotti', 'Daverio (VA) 21020', 'https://maps.app.goo.gl/gKYQmtJgVz2rcHka9',             '🏛️', 1),
  ('Il ricevimento','Villa Morotti', 'Daverio (VA) 21020', 'https://maps.google.com/?q=Villa+Morotti+Daverio+VA',    '🏛️', 2)
ON CONFLICT DO NOTHING;
