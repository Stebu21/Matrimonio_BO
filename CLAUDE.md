# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wedding website for Sofia & Stefano (October 3, 2026). Full-stack Node.js app with admin panel, deployed on Railway. All text is in Italian.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server with auto-reload (node --watch)
npm start            # Production start
```

No build step, no test framework, no linter configured.

## Architecture

Single Express server (`server.js`) with SQLite (better-sqlite3) and vanilla HTML/CSS/JS frontend.

- **server.js** - Entry point. Sets up Express middleware (sessions, static files) and mounts `/api` routes. Calls `db.init()` on startup.
- **db/database.js** - Database layer. Creates tables and seeds default data on first run. Exports query helper functions (no ORM). DB file lives at `db/matrimonio.db`.
- **routes/api.js** - All API endpoints under `/api/`. Public GET routes + public RSVP PATCH. Admin routes protected by `auth` middleware.
- **middleware/auth.js** - Session-based auth check (`req.session.isAdmin`).
- **public/index.html** - Public-facing wedding site (single page, vanilla JS).
- **public/admin.html** - Admin panel (6 tabs: guests, texts, photos, timeline, locations, settings).
- **public/uploads/** - Photo uploads served as static files.

## Key Patterns

- **Auth**: Admin login checks against env vars (`ADMIN_USER`/`ADMIN_PASS`), but a DB-stored `admin_pass_override` setting takes priority over env for password.
- **DB seeding**: Tables and default data are only inserted when tables are empty (idempotent `init()`).
- **File uploads**: Multer handles photo uploads (max 10MB, jpeg/png/webp/gif only) to `public/uploads/`.
- **Guest import**: Supports TSV format from matrimonio.com via `/api/guests/import-matrimoniocom`.
- **All DB columns use Italian names** (nome, cognome, confermato, etc.).

## Environment Variables

`PORT`, `SESSION_SECRET`, `ADMIN_USER`, `ADMIN_PASS` (see `.env.example`).

## Deployment

Railway with nixpacks builder. Healthcheck at `/api/settings`. Volumes needed for `public/uploads/` and `db/` to persist across deploys.
