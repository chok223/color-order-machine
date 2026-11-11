// 색칠 그림 전용 서비스 워커 (다른 프로그램과 캐시를 따로 씀)
// 저장된 파일을 먼저 보여 주므로 인터넷이 없거나 불안정해도 바로 열린다. 뒤에서 몰래 최신으로 갱신한다.
const CACHE_NAME = 'coloring-v2';
const CORE_FILES = ['./', 'index.html', 'style.css', 'app.js', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'images/list.json'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE_NAME);
    await c.addAll(CORE_FILES.filter((f) => f !== 'images/list.json'));
    try {
      const r = await fetch('images/list.json', { cache: 'no-cache' });
      if (r.ok) {
        await c.put('images/list.json', r.clone());
        const names = await r.json();
        await Promise.all(names.map((n) => c.add('images/' + encodeURIComponent(n)).catch(() => {})));
      }
    } catch (err) {}
  })());
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => {
      if (r && r.ok) cache.put(e.request, r.clone());
      return r;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('', { status: 504 });
  })());
});
