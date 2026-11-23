// App da Mari: notificações e uma cópia da página para abrir mesmo sem internet.
const CACHE = 'mari-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Página: tenta a rede primeiro (preços sempre atuais); sem internet, mostra a última cópia.
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.mode !== 'navigate') return;
  e.respondWith(fetch(r).then(resp => {
    const copia = resp.clone();
    caches.open(CACHE).then(c => c.put(new URL(r.url).pathname, copia)).catch(() => {});
    return resp;
  }).catch(() => caches.match(new URL(r.url).pathname).then(x => x || caches.match('/'))));
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { corpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Celular da Mari', {
    body: d.corpo || '',
    icon: '/app/icon-192.png',
    badge: '/app/badge-96.png',
    tag: d.tag || 'mari',
    renotify: true,
    vibrate: [120, 60, 120],
    data: { url: d.url || '/#veredito' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(lista => {
    for (const c of lista) if (new URL(c.url).origin === self.location.origin) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
