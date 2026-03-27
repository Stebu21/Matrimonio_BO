# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wedding website for Sofia & Stefano (October 3, 2026). Netlify (static + serverless functions) + Supabase (PostgreSQL + Storage). All text is in Italian.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Local dev via netlify dev (http://localhost:8888)
```

No build step, no test framework, no linter configured. Requires `netlify-cli` installed globally.

## Architecture

Static HTML frontend served by Netlify, with serverless functions as API backend and Supabase for data + file storage.

- **public/index.html** - Public-facing wedding site (single page, vanilla JS).
- **public/admin.html** - Admin panel (6 tabs: guests, texts, photos, timeline, locations, settings).
- **netlify/functions/** - Serverless API functions, one per resource/action.
- **netlify/functions/_shared/supabase.js** - Supabase client (service role key, bypasses RLS).
- **netlify/functions/_shared/auth.js** - JWT-based auth: sign/verify tokens, cookie helpers.
- **netlify.toml** - Build config + redirect rules mapping `/api/*` to functions.
- **supabase/schema.sql** - PostgreSQL schema, RLS policies, storage bucket, and seed data.

## Key Patterns

- **Auth**: Admin login checks against env vars (`ADMIN_USER`/`ADMIN_PASS`), but a DB-stored `admin_pass_override` setting takes priority. JWT token stored in httpOnly cookie (24h expiry), verified in each protected function via `verifyToken(event)`.
- **API routing**: `netlify.toml` redirects map `/api/*` paths to `/.netlify/functions/*`. Functions parse `event.path` to extract resource IDs (e.g. `/api/guests/123`).
- **Photo storage**: Photos uploaded via multipart form data, parsed with `parse-multipart-data`, stored in Supabase Storage bucket `photos`. Public URLs returned via `supabase.storage.from('photos').getPublicUrl()`.
- **DB access**: All functions use the Supabase service role key (bypasses RLS). Schema uses standard PostgreSQL with `SERIAL` primary keys.
- **All DB columns use Italian names** (nome, cognome, confermato, etc.).

## Environment Variables

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USER`, `ADMIN_PASS`, `SESSION_SECRET` (see `.env.example`).
