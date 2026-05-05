const CACHE_NAME = 'dashboard-v5-cache-v1';
const ASSETS_TO_CACHE = [
  '/MyDashboard/',
  '/MyDashboard/manifest.json',
  '/MyDashboard/icon.png',
  '/MyDashboard/favicon.ico'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First Strategy for dynamic content, Cache First for static)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone it and save to cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-habits') {
    event.waitUntil(syncHabits());
  }
});

async function syncHabits() {
  console.log('Background syncing habits...');
  // In a real app, you'd pull from IndexedDB and send to your API/Supabase
  // For this local-storage based app, we rely on the client-side sync
  // but registering the sync event ensures the browser keeps the process alive.
  return Promise.resolve();
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Dashboard Update', body: 'Something changed!' };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon.png',
        badge: '/icon.png'
      }),
      // Set badge from push event if count is provided
      data.badgeCount != null && 'setAppBadge' in self.registration
        ? self.registration.setAppBadge(data.badgeCount)
        : Promise.resolve()
    ])
  );
});

// Badge control via postMessage from the page
// This is the most reliable path for Chrome iOS PWA badge support
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SET_BADGE') return;

  const count = event.data.count;

  if (!('setAppBadge' in self.registration)) return;

  if (count > 0) {
    self.registration.setAppBadge(count).catch((err) => console.error('SW badge error:', err));
  } else {
    self.registration.clearAppBadge().catch((err) => console.error('SW badge clear error:', err));
  }
});
