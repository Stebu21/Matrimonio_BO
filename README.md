# Matrimonio Sofia & Stefano

Sito web per matrimoni completamente configurabile dal pannello admin.
Deployabile su **Netlify** + **Supabase**.

## Stack

- **Netlify** — hosting statico + serverless functions
- **Supabase** — database PostgreSQL + storage foto
- **HTML/CSS/Vanilla JS** — nessun framework, nessun build step
- **JWT** — autenticazione admin stateless via cookie

---

## Avvio in locale

### 1. Clona il repository

```bash
git clone <url-del-repo>
cd matrimonio-web
```

### 2. Installa le dipendenze

```bash
npm install
```

Serve anche la Netlify CLI:

```bash
npm install -g netlify-cli
```

### 3. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** e incolla il contenuto di `supabase/schema.sql` — crea tabelle, RLS, storage bucket e dati di default
3. Vai su **Storage** e verifica che il bucket `photos` esista ed sia pubblico

### 4. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Compila il file `.env`:

| Variabile                  | Descrizione                                  |
|----------------------------|----------------------------------------------|
| `SUPABASE_URL`             | URL del progetto Supabase                    |
| `SUPABASE_SERVICE_ROLE_KEY`| Service role key (da Settings > API)         |
| `ADMIN_USER`               | Username admin (default: `admin`)            |
| `ADMIN_PASS`               | Password admin (default: `admin`)            |
| `SESSION_SECRET`           | Stringa segreta per firmare i JWT            |

### 5. Avvia il server

```bash
npm run dev
```

Questo avvia `netlify dev`, che serve i file statici e le functions localmente.

### 6. Apri nel browser

- **Sito pubblico:** http://localhost:8888
- **Pannello admin:** http://localhost:8888/admin.html

### Credenziali admin di default

```
Username: admin
Password: admin
```

La password puo' essere cambiata dal pannello admin (tab Impostazioni).

---

## Deploy su Netlify

### 1. Crea un account su [netlify.com](https://www.netlify.com)

### 2. Collega il repository

- **New site** > **Import an existing project** > seleziona il repo GitHub
- Netlify rileva automaticamente `netlify.toml`

### 3. Configura le variabili d'ambiente

Vai in **Site settings > Environment variables** e aggiungi:

```
SUPABASE_URL             = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbG...
ADMIN_USER               = admin
ADMIN_PASS               = <la-tua-password>
SESSION_SECRET           = <stringa-casuale-lunga>
```

Per generare un secret sicuro:

```bash
openssl rand -hex 32
```

### 4. Deploy

Netlify fa il deploy automaticamente ad ogni `git push` sul branch principale.

---

## Struttura del progetto

```
/
├── netlify.toml                      <- config Netlify (build + redirects API)
├── package.json
├── .env.example                      <- template variabili d'ambiente
├── supabase/
│   └── schema.sql                    <- schema PostgreSQL + seed dati
├── netlify/
│   └── functions/
│       ├── _shared/
│       │   ├── supabase.js           <- client Supabase (service role)
│       │   └── auth.js               <- JWT auth helper
│       ├── settings.js               <- GET impostazioni
│       ├── guests.js                 <- CRUD invitati + RSVP
│       ├── guests-import.js          <- import da matrimonio.com
│       ├── photos.js                 <- CRUD foto (Supabase Storage)
│       ├── timeline.js               <- CRUD programma
│       ├── locations.js              <- CRUD location
│       ├── admin-login.js            <- login admin
│       ├── admin-logout.js           <- logout admin
│       ├── admin-me.js               <- check sessione
│       ├── admin-settings.js         <- salva impostazioni
│       └── admin-password.js         <- cambio password
└── public/
    ├── index.html                    <- sito frontend (single page)
    └── admin.html                    <- pannello admin
```

---

## Pannello Admin

Accessibile da `/admin.html`. Organizzato in 6 tab:

| Tab              | Funzionalita'                                                    |
|------------------|------------------------------------------------------------------|
| **Invitati**     | Aggiungi, importa CSV, esporta, conferma/elimina invitati        |
| **Testi**        | Modifica tutti i testi del sito (hero, storia, regalo, RSVP...) |
| **Foto**         | Upload drag&drop, gestione hero, carousel on/off, riordina       |
| **Programma**    | Gestisci la timeline della giornata                              |
| **Location**     | Aggiungi/modifica location con link Google Maps                  |
| **Impostazioni** | Cambia password, elimina tutti gli invitati                      |

### Import CSV invitati

Il formato CSV per importare invitati e':

```csv
Nome,Cognome
Mario,Rossi
Anna,Bianchi
```

La prima riga (intestazione) viene ignorata.

---

## API

Tutte le API sono sotto `/api/`. Le GET sono pubbliche, le POST/PATCH/DELETE richiedono autenticazione admin (JWT cookie).

| Metodo   | Endpoint                          | Descrizione                    |
|----------|-----------------------------------|--------------------------------|
| `GET`    | `/api/settings`                   | Tutti i settings               |
| `GET`    | `/api/guests`                     | Lista invitati                 |
| `PATCH`  | `/api/guests/:id`                 | Conferma RSVP (pubblico)       |
| `GET`    | `/api/photos`                     | Lista foto                     |
| `GET`    | `/api/timeline`                   | Programma della giornata       |
| `GET`    | `/api/locations`                  | Location                       |
| `POST`   | `/api/admin/login`                | Login admin                    |
| `POST`   | `/api/admin/settings`             | Salva impostazioni (protetto)  |
| `POST`   | `/api/guests/import-matrimoniocom`| Import da matrimonio.com       |

---

## Note

- Le foto sono salvate su **Supabase Storage** (bucket `photos`, pubblico)
- La password admin puo' essere cambiata dal pannello: viene salvata nel database e ha priorita' sulle variabili d'ambiente
- Il sito e' responsive e ottimizzato per mobile
- Non serve nessun volume o persistenza esterna: Supabase gestisce tutto
