# Matrimonio Sofia & Stefano

Sito web per matrimoni completamente configurabile dal pannello admin.
Deployabile su **Railway** con un solo click.

## Stack

- **Node.js 20+** con Express.js
- **SQLite** via better-sqlite3 (zero config, zero servizi esterni)
- **HTML/CSS/Vanilla JS** (nessun framework, nessun build step)
- **Multer** per upload foto

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

### 3. Configura le variabili d'ambiente

Copia il file di esempio e modificalo se vuoi:

```bash
cp .env.example .env
```

Il file `.env` contiene:

| Variabile        | Default                              | Descrizione                        |
|------------------|--------------------------------------|------------------------------------|
| `PORT`           | `3000`                               | Porta del server                   |
| `SESSION_SECRET` | `cambia-questa-stringa-con-...`      | Stringa segreta per le sessioni    |
| `ADMIN_USER`     | `sposi`                              | Username per il pannello admin     |
| `ADMIN_PASS`     | `sofia2026`                          | Password per il pannello admin     |

### 4. Avvia il server

```bash
# Produzione
npm start

# Sviluppo (auto-reload)
npm run dev
```

### 5. Apri nel browser

- **Sito pubblico:** http://localhost:3000
- **Pannello admin:** http://localhost:3000/admin.html

### Credenziali admin di default

```
Username: sposi
Password: sofia2026
```

La password puo' essere cambiata dal pannello admin (tab Impostazioni).

---

## Deploy su Railway

### 1. Crea un account su [railway.app](https://railway.app)

### 2. Collega il repository

- Vai su **New Project** > **Deploy from GitHub repo**
- Seleziona il repository del matrimonio
- Railway rileva automaticamente `package.json` e usa `npm start`

### 3. Configura le variabili d'ambiente

Vai in **Variables** e aggiungi:

```
SESSION_SECRET = <stringa-casuale-lunga>
ADMIN_USER     = sposi
ADMIN_PASS     = <la-tua-password>
```

Per generare un secret sicuro:

```bash
openssl rand -hex 32
```

### 4. Aggiungi i volumi per persistenza

Vai in **Settings > Volumes** e crea due volumi:

| Volume  | Mount Path           | Scopo                              |
|---------|----------------------|------------------------------------|
| uploads | `/app/public/uploads`| Foto caricate sopravvivono ai deploy |
| db      | `/app/db`            | Database SQLite persiste tra i deploy |

> Senza i volumi, le foto e il database vengono persi ad ogni redeploy.

### 5. Deploy

Railway fa il deploy automaticamente ad ogni `git push` sul branch principale.
Il primo avvio crea il database e inserisce tutti i dati di default.

---

## Struttura del progetto

```
/
├── server.js                  <- entry point Express
├── package.json
├── railway.toml               <- config Railway
├── .env                       <- variabili d'ambiente (non committare in produzione)
├── .env.example               <- template variabili d'ambiente
├── db/
│   └── database.js            <- init SQLite + query
├── routes/
│   └── api.js                 <- API REST + rotte admin
├── middleware/
│   └── auth.js                <- autenticazione admin (session cookie)
└── public/
    ├── index.html             <- sito frontend (single page)
    ├── admin.html             <- pannello admin
    └── uploads/               <- foto caricate
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

Tutte le API sono sotto `/api/`. Le GET sono pubbliche, le POST/PATCH/DELETE richiedono sessione admin.

| Metodo   | Endpoint              | Descrizione                    |
|----------|-----------------------|--------------------------------|
| `GET`    | `/api/settings`       | Tutti i settings               |
| `GET`    | `/api/guests`         | Lista invitati                 |
| `PATCH`  | `/api/guests/:id`     | Conferma RSVP (pubblico)       |
| `GET`    | `/api/photos`         | Lista foto                     |
| `GET`    | `/api/timeline`       | Programma della giornata       |
| `GET`    | `/api/locations`      | Location                       |
| `POST`   | `/api/admin/login`    | Login admin                    |
| `POST`   | `/api/admin/settings` | Salva impostazioni (protetto)  |

---

## Primo avvio

Al primo avvio il sistema automaticamente:

1. Crea il database SQLite con tutte le tabelle
2. Inserisce i dati di default (testi, timeline, location)
3. Crea la cartella uploads

Non serve nessuna configurazione manuale: il sito funziona subito.

---

## Note

- Le foto vengono salvate in `public/uploads/` e servite come file statici
- Il database e' in `db/matrimonio.db`
- La password admin puo' essere cambiata dal pannello: viene salvata nel database e ha priorita' sulle variabili d'ambiente
- Il sito e' responsive e ottimizzato per mobile
