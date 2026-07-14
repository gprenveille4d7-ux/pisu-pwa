const CACHE_NAME = "pisu-acr-cache-v225";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css?v=225",
  "./version.js?v=225",
  "./saed.js?v=225",
  "./app.js?v=225",
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
  "./patient-sync.js?v=225",
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

async function fetchNetworkFirst(request, fallbackRequest = request) {
  try {
    const response = await fetch(request, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Réponse réseau ${response.status}`);
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.put(fallbackRequest, response.clone());

    return response;
  } catch {
    return caches.match(fallbackRequest);
  }
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetchNetworkFirst(event.request, "./index.html"));
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isVersionedAsset = requestUrl.origin === self.location.origin &&
    requestUrl.searchParams.has("v");

  if (isVersionedAsset) {
    event.respondWith(fetchNetworkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
