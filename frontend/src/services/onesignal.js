// OneSignal Web Push Integration
//
// Phase 4 wiring:
//   1. Init the SDK with the app id from env.
//   2. After init, wait until we have a player_id (push subscription id).
//   3. Sync that player_id into public.users.onesignal_player_id so the
//      Edge Function can target the right device when sending pushes.
//   4. Re-sync whenever the subscription changes (user grants/revokes,
//      installs as PWA, switches browser, etc).
//   5. When app is foregrounded, suppress the OneSignal notification —
//      our in-app ReceivedNotificationOverlay (driven by Supabase Realtime)
//      handles the visual.

import { supabase } from '../lib/supabase';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let initialized = false;
let initPromise = null;

function loadSdk() {
  return new Promise((resolve) => {
    if (window.OneSignal || document.getElementById('onesignal-sdk')) {
      // Already loading or loaded
      const wait = setInterval(() => {
        if (window.OneSignal) {
          clearInterval(wait);
          resolve();
        }
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

    // Tag the OneSignal player with our supabase user id so notifications
    // sent via External Id work too.
    try {
      await OneSignal.login(user.id);
    } catch (err) {
      // login() can throw if already logged in, ignore
    }
  } catch (err) {
    console.error('[OneSignal] sync player_id failed:', err);
  }
}

export async function initOneSignal() {
  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID not set — push notifications disabled.');
    return null;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await loadSdk();
      window.OneSignalDeferred = window.OneSignalDeferred || [];

      window.OneSignalDeferred.push(async function (OneSignal) {
        if (initialized) return;
        initialized = true;

        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/onesignal/' },
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          notifyButton: { enable: false },
        });

        // Sync immediately if user is already subscribed
        await syncPlayerIdToDB(OneSignal);

        // Re-sync whenever the subscription state changes (user grants/revokes,
        // moves to PWA install, etc).
        OneSignal.User.PushSubscription.addEventListener('change', async () => {
          await syncPlayerIdToDB(OneSignal);
        });

        // When auth state changes (sign in / sign out), re-sync the external id.
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            try { await OneSignal.login(session.user.id); } catch {}
            await syncPlayerIdToDB(OneSignal);
          } else {
            try { await OneSignal.logout(); } catch {}
          }
        });

        // Suppress the OS notification while the page is visible — let our
        // in-app overlay handle the visual instead.
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          event.preventDefault();
        });
      });

      return true;
    } catch (error) {
      console.error('[OneSignal] init error:', error);
      return null;
    }
  })();

  return initPromise;
}

/**
 * Returns a promise that resolves when OneSignal is ready, with the SDK instance.
 */
function withOneSignal() {
  return new Promise((resolve) => {
    if (!ONESIGNAL_APP_ID) return resolve(null);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push((OneSignal) => resolve(OneSignal));
  });
}

export async function requestNotificationPermission() {
  const OneSignal = await withOneSignal();
  if (!OneSignal) return 'denied';
  try {
    await OneSignal.Notifications.requestPermission();
    // After grant, sync immediately
    await syncPlayerIdToDB(OneSignal);
    return OneSignal.Notifications.permission ? 'granted' : 'denied';
  } catch (error) {
    console.error('[OneSignal] permission request error:', error);
    return 'denied';
  }
}

export async function getPlayerId() {
  const OneSignal = await withOneSignal();
  return OneSignal?.User?.PushSubscription?.id || null;
}

export async function setExternalUserId(userId) {
  const OneSignal = await withOneSignal();
  if (!OneSignal) return;
  try { await OneSignal.login(userId); } catch (err) { console.error(err); }
}

// Kept for back-compat; production sends should go through send-notification Edge Function.
export async function sendPushNotification(playerId, title, message, data = {}) {
  console.log('[OneSignal] client-side sendPushNotification is a no-op; use Edge Function.');
  return { app_id: ONESIGNAL_APP_ID, include_player_ids: [playerId], headings: { en: title }, contents: { en: message }, data };
}
