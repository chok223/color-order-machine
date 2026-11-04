// 동물 먹이 주기 오프라인용. 인터넷이 되면 항상 최신 파일을 받고, 안 될 때만 저장된 파일을 보여 줌.
// 파일을 고쳐 올린 뒤에도 패드가 바로 새 버전을 받으니 보통은 버전을 올릴 필요가 없음.
// (파일 목록을 바꾸거나 오래된 저장본을 비우고 싶을 때만 아래 번호를 올림)
const CACHE_NAME = 'feed-v1';

const CORE_FILES = [
  './',
  'index.html',
  'style.css',
  'art.js',
  'core.js',
  'pet.js',
  'env.js',
  'play.js',
  'app.js',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
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
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k.indexOf('feed-') === 0).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
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
