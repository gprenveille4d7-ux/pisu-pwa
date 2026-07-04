const CACHE_NAME = "pisu-acr-cache-v36";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css?v=151",
  "./app.js",
  "./acr-adulte.js",
  "./acr-enfant.js",
  "./douleur-thoracique.js",
  "./exposition-fumees.js",
  "./brulures.js",
  "./crise-convulsive.js",
  "./anaphylaxie.js",
  "./hemorragie.js",
  "./hypoglycemie.js",
  "./asthme-bpco.js",
  "./antalgie.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => caches.match("./index.html"));
    })
  );
});
