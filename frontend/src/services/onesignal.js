// OneSignal Web Push Integration (v16 SDK)
//
// Required setup:
//   1. /OneSignalSDKWorker.js exists at site root (importScripts the SDK worker)
//   2. VITE_ONESIGNAL_APP_ID is set
//   3. App is served over HTTPS (Vercel handles this)
//   4. The OneSignal dashboard's "Site URL" matches your deployed origin
//
// On init we:
//   - Sync the OneSignal player_id (push subscription id) into
//     public.users.onesignal_player_id so the Edge Function can target this device
//   - Bind External User Id to the supabase auth uid
//   - Re-sync on subscription / auth changes
//   - Suppress OS notifications while page is visible — in-app overlay (driven
//     by Supabase Realtime) handles foreground UX

import { supabase } from '../lib/supabase';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let initStarted = false;
let onesignalReadyResolve;
const onesignalReady = new Promise((r) => { onesignalReadyResolve = r; });

function loadSdkOnce() {
  return new Promise((resolve) => {
    if (document.getElementById('onesignal-sdk')) {
      const wait = setInterval(() => {
        if (window.OneSignalDeferred) { clearInterval(wait); resolve(); }
      }, 50);
      return;
    }
    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

async function syncPlayerIdToDB(OneSignal) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    const playerId = OneSignal?.User?.PushSubscription?.id;
    if (!playerId) return;

    await supabase
      .from('users')
      .update({ onesignal_player_id: playerId })
      .eq('id', user.id);

    try { await OneSignal.login(user.id); } catch { /* already bound */ }
  } catch (err) {
    console.error('[OneSignal] sync player_id failed:', err);
  }
}

export async function initOneSignal() {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID missing — push disabled.');
    return null;
  }
  if (initStarted) return onesignalReady;
  initStarted = true;

  await loadSdkOnce();
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  window.OneSignalDeferred.push(async function (OneSignal) {
    try {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        // Use OneSignal's default worker path (/OneSignalSDKWorker.js).
        // Don't override — public/OneSignalSDKWorker.js is served from root.
        allowLocalhostAsSecureOrigin: true,
        notifyButton: { enable: false },
      });

      // Sync immediately if already signed in + subscribed
      await syncPlayerIdToDB(OneSignal);

      // Re-sync on subscription state changes (grant/revoke, install, etc)
      OneSignal.User.PushSubscription.addEventListener('change', () => {
        syncPlayerIdToDB(OneSignal);
      });

      // Re-sync on supabase auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try { await OneSignal.login(session.user.id); } catch {}
          await syncPlayerIdToDB(OneSignal);
        } else {
          try { await OneSignal.logout(); } catch {}
        }
      });

      // Suppress OS notifications while page is visible
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        event.preventDefault();
      });

      onesignalReadyResolve(OneSignal);
    } catch (err) {
      console.error('[OneSignal] init error:', err);
      onesignalReadyResolve(null);
    }
  });

  return onesignalReady;
}

/**
 * Triggers the native browser notification permission prompt.
 * Returns 'granted' | 'denied' | 'default'.
 */
export async function requestNotificationPermission() {
  // First-class fallback: if OneSignal isn't configured / loaded yet,
  // ask the browser directly so the unified Permissions onboarding still works.
  const OneSignal = await Promise.race([
    onesignalReady,
    new Promise((r) => setTimeout(() => r(null), 3000)),
  ]);

  if (OneSignal) {
    try {
      await OneSignal.Notifications.requestPermission();
      // Give SDK a moment to register the subscription
      await new Promise((r) => setTimeout(r, 500));
      await syncPlayerIdToDB(OneSignal);
    } catch (err) {
      console.error('[OneSignal] permission request error:', err);
    }
  } else if (typeof Notification !== 'undefined') {
    try { await Notification.requestPermission(); } catch {}
  }

  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

export async function getPlayerId() {
  const OneSignal = await onesignalReady;
  return OneSignal?.User?.PushSubscription?.id || null;
}

export async function setExternalUserId(userId) {
  const OneSignal = await onesignalReady;
  if (!OneSignal) return;
  try { await OneSignal.login(userId); } catch (err) { console.error(err); }
}

// Production sends go through the send-notification Edge Function.
export async function sendPushNotification(playerId, title, message, data = {}) {
  console.log('[OneSignal] client-side sendPushNotification is a no-op; use Edge Function.');
  return { app_id: ONESIGNAL_APP_ID, include_player_ids: [playerId], headings: { en: title }, contents: { en: message }, data };
}
