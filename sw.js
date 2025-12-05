// ===== SERVICE WORKER ATUALIZADO =====
// Versão incrementada para forçar atualização do cache
const CACHE_NAME = 'eventos-local-v2';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './img/logo.png'
];

// === Instalação ===
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando nova versão do cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pré-carregando arquivos...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// === Ativação ===
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Ativando e limpando caches antigos...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removendo cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// === Intercepta requisições ===
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[ServiceWorker] Servindo do cache:', event.request.url);
          return response;
        }
        console.log('[ServiceWorker] Buscando online:', event.request.url);
        return fetch(event.request)
          .then((responseOnline) => {
            if (!responseOnline || responseOnline.status !== 200) return responseOnline;
            const responseClone = responseOnline.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return responseOnline;
          });
      })
      .catch(() => caches.match('./index.html'))
  );
});

// === Atualização manual forçada (opcional) ===
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    console.log('[ServiceWorker] Atualização manual ativada.');
    self.skipWaiting();
  }
});
