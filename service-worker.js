/*
  Service worker de l'app "Fiches & Quiz FR-AR".

  Stratégie : "réseau d'abord" pour la page principale, afin que chaque
  nouvelle visite (avec connexion) récupère automatiquement la dernière
  version publiée sur GitHub Pages — sans avoir besoin de changer un
  numéro de version ici. En cas de coupure réseau, on sert la version
  mise en cache pour que l'app reste utilisable hors-ligne.
*/

const CACHE_NAME = 'fiches-quiz-cache-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Documents (la page elle-même) : réseau d'abord, cache en secours.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // Autres ressources (icônes, manifest...) : cache d'abord, réseau en secours.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});
