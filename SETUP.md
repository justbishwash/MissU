# MissU — Setup Guide

> "Closer than distance." ❤️

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env
# Fill in your keys (see below)
npm run dev
```

---

## 1. Supabase Setup (5 min)

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy your **Project URL** and **anon/public key** from Settings → API
3. Paste into `frontend/.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...your-key
   ```
4. Go to **SQL Editor** → New query → paste contents of `backend/migrations/001_initial_schema.sql` → Run
5. Go to **Authentication** → Providers:
   - Enable **Email** (magic link / OTP)
   - Enable **Google** (add OAuth credentials)
6. Go to **Authentication** → Settings:
   - Set Site URL to your deployment URL (or `http://localhost:5173` for dev)

---

## 2. OneSignal Setup (5 min)

1. Go to [onesignal.com](https://onesignal.com) → Create app
2. Select **Web Push** platform
3. Configure:
   - Site URL: your deployment URL
   - Default icon: upload the heart icon
4. Copy **App ID** → paste into `frontend/.env`:
   ```
   VITE_ONESIGNAL_APP_ID=your-app-id
   ```
5. For sending notifications server-side, you'll need the **REST API Key** (used in Supabase Edge Function — Phase 2)

---

## 3. Run Locally

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` on your phone (same WiFi) or use ngrok for HTTPS (required for push notifications and service worker).

---

## 4. Build for Production

```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to:
- **Vercel** (recommended, free)
- **Netlify**
- **Cloudflare Pages**

Make sure to set environment variables in your hosting provider.

---

## 5. Install as PWA

On Android Chrome:
1. Open your deployed URL
2. Tap ⋮ menu → "Add to Home Screen"
3. App installs with full standalone mode

---

## Architecture

```
/frontend          → React + Vite + Tailwind + Framer Motion
  /src
    /components    → Reusable UI (MissYouButton, FloatingHearts, etc.)
    /pages         → Route pages (Home, Login, Pairing, Stats, Settings)
    /store         → Zustand state (auth, couple, notifications, settings)
    /hooks         → Custom hooks (useGeolocation, useRealtime)
    /lib           → Utilities (supabase client, distance, sounds)
    /services      → External integrations (OneSignal)
  /public          → PWA assets (manifest, service worker, icons)

/backend           → Supabase config
  /migrations      → SQL schema + RLS policies
  /functions       → Edge Functions (Phase 2)
```

---

## Features (Phase 1)

- ✅ Installable PWA with offline support
- ✅ OTP / Google / Guest authentication
- ✅ Couple pairing via QR code or 6-digit invite code
- ✅ Giant animated "Missing You" button with haptics + sound
- ✅ Real-time push notifications (OneSignal)
- ✅ Mood picker (6 moods with unique animations)
- ✅ Live distance card (Haversine formula + geolocation)
- ✅ Distance-based emotional UI states
- ✅ Love streak counter
- ✅ Partner presence indicator
- ✅ Relationship statistics page
- ✅ Settings (notifications, location, vibration, sound, themes)
- ✅ Anti-spam cooldown
- ✅ Row Level Security on all tables
- ✅ Floating hearts + particle burst animations
- ✅ Web Audio API sound effects (no audio files)
- ✅ Glassmorphism UI with pastel gradients

---

## Phase 2 (Coming Next)

- Memories scrapbook (images, voice notes)
- QR camera scanner
- Supabase Edge Functions for secure notification dispatch
- Mini-map with Leaflet
- Theme unlocks + anniversary rewards
- Emergency attention mode
- Quick-reply notification actions



---

## Phase 2 Setup Additions

### 6. Run the Phase 2 migration

In Supabase SQL Editor, run `backend/migrations/002_memories.sql`. This adds:
- `memories` table (image / voice / note / anniversary types)
- `theme_unlocks` table (per-couple theme rewards)
- `memories` storage bucket (public, with auth-only upload)
- RLS policies for both

### 7. Deploy the Edge Function (recommended for production)

The `send-notification` Edge Function dispatches OneSignal pushes server-side
so your REST API key never ships to the browser. It also enforces rate limits
and verifies couple membership.

```bash
# install Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set ONESIGNAL_APP_ID=your-app-id
supabase secrets set ONESIGNAL_REST_API_KEY=your-rest-key

# Deploy
supabase functions deploy send-notification --no-verify-jwt
```

Until you deploy this, the app falls back to client-side DB inserts (Phase 1
behavior) — push notifications still work via OneSignal's web SDK, but
without server-side rate limiting.

### 8. New routes added in Phase 2

| Route | Purpose |
|-------|---------|
| `/scan` | Camera-based QR pairing (uses `qr-scanner` lib) |
| `/memories` | Couple scrapbook (photos, voice, notes) |

### 9. New features

- **Memories scrapbook** — image upload, in-browser voice recording (MediaRecorder), text notes, timeline view
- **QR camera scanner** — auto-detects 6-digit codes from QR
- **Mini love map** — Leaflet with pastel theme, heart markers, toggle on home
- **Emergency Need Attention** — confirm dialog, urgent vibration pattern, server-side priority flag
- **Theme system** — 5 themes with unlock criteria (streak / days together)
- **Quick-reply actions** — service worker handles Miss You Too / Send Hug from notification, dispatches reverse notification automatically
- **Server-side notification dispatch** — Edge Function with rate limiting, couple verification, and OneSignal integration
