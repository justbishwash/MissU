# MissU — Deploy Guide

> Get MissU live (free) in ~20 minutes. End-to-end: Supabase + OneSignal + Vercel.

---

## TL;DR — fastest free stack

| Piece | Service | Free tier | Why |
|---|---|---|---|
| **Frontend hosting** | **Vercel** | unlimited bandwidth, HTTPS, custom domain | One-click deploy from GitHub, perfect for Vite SPAs |
| **Database + Auth + Storage + Realtime + Edge Functions** | **Supabase** | 500 MB DB, 1 GB storage, 50K MAU, 500K Edge invocations/mo | Powers everything backend |
| **Push notifications** | **OneSignal** | 10K subscribers free | Web Push for Chrome/Android |

Total cost: **$0** until you hit ~10K users.

Alternatives (any work): **Netlify**, **Cloudflare Pages**, **GitHub Pages** for hosting.

---

## Part 1 — Local first (5 min)

Test locally before deploying. Run on your laptop:

```bash
cd frontend
npm install
cp .env.example .env
```

Open `.env` and leave it with the placeholders for now — the app degrades gracefully without keys (you can click around the UI, just can't actually send notifications).

```bash
npm run dev
```

Open **http://localhost:5173**.

> **Important:** Web Push notifications, geolocation, camera (QR scanner), and service workers all require **HTTPS**. They will NOT work over `http://` except on `localhost`. So local dev works fine, but you can't test push on `http://192.168.x.x` from your phone — you need to deploy first (or use ngrok).

✅ Works locally? Great. Move on.

---

## Part 2 — Set up Supabase (5 min)

1. Go to **[supabase.com](https://supabase.com)** → sign in with GitHub → **New project**
2. Pick a name (`missu`), set a strong DB password, choose region closest to your users → **Create project** (takes ~2 min to provision)
3. Once provisioned, go to **Settings → API**. Copy two values:
   - `Project URL` → `https://xxx.supabase.co`
   - `anon public` key → long `eyJ...` JWT
4. Open **SQL Editor → New query**. Paste in order, clicking **Run** after each:
   - Contents of `backend/migrations/001_initial_schema.sql`
   - Contents of `backend/migrations/002_memories.sql`
   - Contents of `backend/migrations/003_phase3.sql`
5. Go to **Authentication → Providers**:
   - **Email**: enable, turn on "Enable Email Confirmations" if you want, or leave off for instant magic links
   - **Google** (optional): enable, follow Supabase's guide for Google OAuth client ID/secret
6. Go to **Authentication → URL Configuration**:
   - Add your eventual deploy URL to **Site URL** (e.g. `https://missu.vercel.app`) and **Redirect URLs**. For now, you can put `http://localhost:5173` and add the prod URL after step 4.

✅ Supabase ready.

---

## Part 3 — Set up OneSignal (5 min)

1. Go to **[onesignal.com](https://onesignal.com)** → sign up free → **New App/Website**
2. Name it `MissU`, select **Web** platform → choose **Custom Code** integration
3. Configure:
   - **Site URL**: your eventual deploy URL (e.g. `https://missu.vercel.app`) — required, but you can update later
   - **Default Icon**: upload a 192x192 heart PNG (or use the one in `frontend/public/icons/`)
   - **My site is not fully HTTPS**: leave UNCHECKED
4. After setup, go to **Settings → Keys & IDs**. Copy:
   - **App ID** (short UUID-style)
   - **REST API Key** (long, you'll use this server-side only)

✅ OneSignal ready.

---

## Part 4 — Deploy to Vercel (5 min)

1. Push your latest code to GitHub (already done if you've been merging the PRs).
2. Go to **[vercel.com](https://vercel.com)** → sign in with GitHub → **Add New → Project**
3. Import your `MissU` repo. **Important settings:**

   | Field | Value |
   |---|---|
   | Framework Preset | Vite (auto-detected) |
   | **Root Directory** | `frontend` |
   | Build Command | `npm run build` (default) |
   | Output Directory | `dist` (default) |

4. Expand **Environment Variables** and add three:
   ```
   VITE_SUPABASE_URL        = https://xxx.supabase.co
   VITE_SUPABASE_ANON_KEY   = eyJ...
   VITE_ONESIGNAL_APP_ID    = your-onesignal-app-id
   ```
5. Click **Deploy**. After ~1 minute you get a URL like `https://missu-abc123.vercel.app`.

6. **Go back to Supabase → Authentication → URL Configuration** and add your Vercel URL to Site URL and Redirect URLs.

7. **Go back to OneSignal → Settings → Web Configuration** and update the Site URL to your Vercel URL.

✅ App is live!

---

## Part 5 — Test on your phone (2 min)

1. Open the Vercel URL on your **Android Chrome**.
2. Tap **⋮ menu → Add to Home Screen** (or use the install banner that appears).
3. App installs as a PWA — opens in standalone mode, no browser chrome.
4. Sign in (Guest mode is fastest), set nickname, get the 6-digit code.
5. Open the same URL on a **second device or browser**, sign in as a different user, enter the code.
6. You're paired. Tap the giant heart button. Watch the receive overlay light up the other phone.
7. Close the app on the receiver. Send another miss. The push notification should fire.

If the push arrives **only when the app is open**, you're missing the OneSignal player_id sync — see "Optional: server-side push" below. The in-app overlay will work either way because it's powered by Supabase Realtime.

---

## Part 6 — Deploy the Edge Function (optional but recommended)

This makes notifications dispatch from your server (not the browser), which means:
- Your OneSignal REST API key stays secret
- Server-side rate limiting (10 notifications/min)
- Couple-membership verification

**Skip this if you just want to test.** Without it, the app falls back to direct DB inserts and the in-app overlay still works perfectly — you just lose the proper Web Push that fires when the app is closed.

Install the Supabase CLI: [supabase.com/docs/guides/local-development/cli](https://supabase.com/docs/guides/local-development/cli/getting-started)

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF   # find this in Supabase dashboard URL

supabase secrets set ONESIGNAL_APP_ID=your-app-id
supabase secrets set ONESIGNAL_REST_API_KEY=your-rest-key

supabase functions deploy send-notification --no-verify-jwt
```

The frontend already calls this function — it'll automatically start using it once deployed.

---

## Common gotchas

**"Service worker not registering"**
- Must be HTTPS. Vercel gives you HTTPS for free. `localhost` also works but `http://192.168.x.x` does not.

**"Push permission shows 'denied' and won't ask again"**
- The user clicked Block. They have to manually re-enable in browser settings (Chrome: Settings → Site Settings → Notifications → find your URL → Allow).

**"Login fails / OAuth redirect mismatch"**
- Add your Vercel URL to Supabase → Authentication → URL Configuration → both Site URL and Redirect URLs.

**"OneSignal player_id is null"**
- The user hasn't granted notification permission yet, or hasn't been on the page long enough for the SDK to register them. Send an in-app push anyway — Realtime will deliver it.

**"Distance card shows 'Location hidden'"**
- Browser blocked geolocation, or user disabled location sharing in Settings. Check Chrome → site settings → Location.

**"QR scanner shows black screen"**
- Camera permission denied, OR you're on `http://` (not localhost). HTTPS is required.

---

## Custom domain (optional)

Vercel → Project → Settings → Domains. Add your domain, follow the DNS instructions. Free, includes auto-renewing SSL.

Then update Site URL in **both** Supabase and OneSignal to the custom domain.

---

## What you should test before Phase 4

- [ ] PWA installs from Android Chrome (Add to Home Screen flow)
- [ ] Standalone mode looks right (no browser chrome)
- [ ] Login works (try all three: OTP, Google, Guest)
- [ ] Pairing works (QR scan + 6-digit code, both directions)
- [ ] Big heart button → partner gets in-app overlay
- [ ] Push notification arrives when receiver app is closed (requires Edge Function or OneSignal config)
- [ ] Distance card shows real distance between two devices
- [ ] Mood picker → all 6 moods deliver mood-specific overlay on partner side
- [ ] Memories: photo upload, voice record, text note
- [ ] Streak counter increments each day
- [ ] Theme switcher unlocks based on streak / days
- [ ] Settings toggles persist across reload

When you've tried all of these, ping me with what worked and what didn't — and we go to Phase 4 with real-world feedback baked in.
