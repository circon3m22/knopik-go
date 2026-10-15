const CACHE_PREFIX = "knopik-go-pixel-";
const CACHE_NAME = `${CACHE_PREFIX}v56-gear-controls`;
const BASE_PATH = new URL("./", self.location.href).pathname.replace(/\/$/, "");
const asset = (path) => `${BASE_PATH}${path}`;
const APP_SHELL = [
  asset("/"),
  asset("/run/"),
  asset("/manifest.webmanifest"),
  asset("/go-icon.svg"),
  asset("/go-apple-touch.png"),
  asset("/go-192.png"),
  asset("/go-512.png"),
];
// Game artwork stays in SVG source; the runner caches it through Canvas.

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Streaming audio uses byte ranges; partial responses cannot go into CacheStorage.
  if (request.headers.has("range") || url.pathname.startsWith(asset("/audio/"))) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, copy)));
          }
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then(async (cache) => (await cache.match(url.pathname)) ?? cache.match(asset("/")))),
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(request)).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          }
          return response;
        }),
    ),
  );
});
