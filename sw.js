const CACHE_NAME = 'color-order-machine-v3';

const CORE_FILES = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'cards.json',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isImage = new URL(event.request.url).pathname.includes('/images/');

  if (isImage) {
    // 그림 파일: 캐시 우선 (한 번 받아두면 오프라인에서도 바로 나와야 하므로)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }

  // 화면/코드/카드 목록: 인터넷이 되면 항상 최신 버전을 받고,
  // 안 될 때만 마지막으로 저장된 버전을 보여줌 (수정 사항이 바로 반영되도록)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
