const CACHE_NAME = 'missu-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/heart.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '❤️ Someone misses you';
  const options = {
    body: data.body || 'Tap to send love back',
    icon: '/icons/icon-192.png',
    badge: '/icons/heart.svg',
    vibrate: [100, 50, 100, 50, 200],
    tag: 'missu-notification',
    renotify: true,
    actions: [
      { action: 'miss-back', title: 'Miss You Too ❤️' },
      { action: 'send-hug', title: 'Send Hug 🫂' },
    ],
    data: {
      url: '/',
      senderId: data.senderId,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_ACTION', action });
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
