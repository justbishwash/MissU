// OneSignal Web Push Integration
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || '';

let OneSignalInstance = null;

export async function initOneSignal() {
  if (!ONESIGNAL_APP_ID) {
    console.warn('OneSignal App ID not configured');
    return null;
  }

  try {
    // Dynamically load OneSignal SDK
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
      
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: '/' },
        notifyButton: { enable: false },
        welcomeNotification: {
          title: 'MissU ❤️',
          message: "You'll be notified when your partner misses you!",
        },
      });
      OneSignalInstance = OneSignal;
    });

    return true;
  } catch (error) {
    console.error('OneSignal init error:', error);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!OneSignalInstance) return false;
  
  try {
    await OneSignalInstance.Notifications.requestPermission();
    return OneSignalInstance.Notifications.permission;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
}

export async function getPlayerId() {
  if (!OneSignalInstance) return null;
  
  try {
    const id = await OneSignalInstance.User.PushSubscription.id;
    return id;
  } catch (error) {
    console.error('Get player ID error:', error);
    return null;
  }
}

export async function setExternalUserId(userId) {
  if (!OneSignalInstance) return;
  
  try {
    await OneSignalInstance.login(userId);
  } catch (error) {
    console.error('Set external user ID error:', error);
  }
}

export async function sendPushNotification(playerId, title, message, data = {}) {
  // In production, this should go through your Supabase Edge Function
  // to keep your OneSignal REST API key secure.
  // This is a client-side placeholder showing the payload structure.
  
  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: [playerId],
    headings: { en: title },
    contents: { en: message },
    data,
    chrome_web_icon: '/icons/icon-192.png',
    chrome_web_badge: '/icons/heart.svg',
    buttons: [
      { id: 'miss-back', text: 'Miss You Too ❤️' },
      { id: 'send-hug', text: 'Send Hug 🫂' },
    ],
    android_channel_id: 'missu-love',
    priority: 10,
    ttl: 86400,
  };

  console.log('Push notification payload (send via Edge Function):', payload);
  return payload;
}

export function onNotificationReceived(callback) {
  if (!OneSignalInstance) return;
  
  OneSignalInstance.Notifications.addEventListener('foregroundWillDisplay', (event) => {
    callback(event.notification);
  });
}
