// NurseHub Egypt PWA Service Worker
const CACHE_NAME = "nursehub-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
];

// Install event — cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch event — network-first for HTML, cache-first for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and non-http(s)
  if (request.method !== "GET" || !request.url.startsWith("http")) return;

  // Navigation: network-first, fall back to cached shell
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("/", clone));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Static assets: cache-first
  if (
    request.url.includes("manifest.webmanifest") ||
    request.url.includes("favicon.svg") ||
    request.url.includes("icon-")
  ) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
      )
    );
    return;
  }

  // Everything else: network-first with offline fallback
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request).then((c) => c || caches.match("/")))
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-data") {
    event.waitUntil(
      // Process queued offline actions when back online
      Promise.resolve()
    );
  }
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "NurseHub Egypt", {
      body: data.body || "لديك إشعار جديد",
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      tag: data.id || "default",
      data: { link: data.link || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) { client.focus(); if ("navigate" in client) client.navigate(link); return; }
      }
      return self.clients.openWindow(link);
    })
  );
});
