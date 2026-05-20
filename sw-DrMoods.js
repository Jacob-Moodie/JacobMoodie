// sw.js
// Service worker for Jacob Moodie's portfolio PWA.
// Handles caching for offline use, push notifications, and notification clicks.

// Change this version string whenever you deploy updates so the old cache gets cleared.
const CACHE_NAME = "jm-portfolio-v1";

// All the static files to pre-cache when the service worker installs.
// These pages and assets will be available even without a network connection.
const STATIC_ASSETS = [
  "/portfolio_index.html",
  "/portfolio_resume.html",
  "/portfolio_projects.html",
  "/portfolio_contact.html",
  "/main.css",
  "/normalize.css",
  "/js/script.js",
  "/js/projects.js",
  "/js/resume.js",
  "/js/security.js",
  "/js/pwa.js",
  "/js/apis/geolocationApi.js",
  "/js/apis/projectsApi.js",
  "/js/apis/storageApi.js",
  "/json/projects.json",
  "/json/resume.json",
  "/manifest.json",
  "/Images/Me in tux.png",
  "/Images/placeholder.png",
  "/Images/Chargediscposter.png"
];

// Install event: pre-cache all static assets so the site works offline.
// skipWaiting() activates the new worker immediately instead of waiting.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: remove any old caches left over from previous service worker versions.
// clients.claim() makes the new worker take control of all open tabs right away.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Removing old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: intercept network requests and serve from cache when offline.
// API requests use network-first so data stays fresh, everything else uses cache-first.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests (skip cross-origin like LinkedIn, Google, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first for API routes so project data is always up to date when online.
  // Falls back to a cached copy when the network is unavailable.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Store a fresh copy in cache after a successful network response.
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          console.log("[SW] Network unavailable, serving API data from cache:", url.pathname);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first for all other requests (HTML, CSS, JS, images).
  // If not in cache yet, fetch from network and store it for next time.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // If completely offline and not cached, return the index as a fallback.
        if (event.request.destination === "document") {
          return caches.match("/portfolio_index.html");
        }
      });
    })
  );
});

// Push event: display a notification when the server sends a push message.
// The push payload should be JSON with a title and body field.
self.addEventListener("push", (event) => {
  let data = {
    title: "JM Portfolio",
    body: "The portfolio has been updated!"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      // If the payload is not JSON, treat it as plain text.
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/Images/Me in tux.png",
    badge: "/Images/placeholder.png",
    tag: "portfolio-update",
    // renotify: true means a new notification replaces the previous one with the same tag.
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notificationclick event: when the user taps a notification, focus the app
// or open a new window if it is not already open.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Look for an existing portfolio tab to focus rather than opening a new one.
      for (const client of windowClients) {
        if (client.url.includes("portfolio") && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow("/portfolio_index.html");
      }
    })
  );
});
