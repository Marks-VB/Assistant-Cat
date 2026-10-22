// Increment this version when changing the shell's cache behavior.
const CACHE_PREFIX = 'assistant-cat-';
const CACHE_VERSION = 'v1';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const APP_SCOPE = self.registration.scope;
const SHELL_URL = new URL('./', APP_SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(SHELL_URL, { cache: 'reload' });
    if (!response.ok) throw new Error(`App shell request failed: ${response.status}`);

    await cache.put(SHELL_URL, response.clone());

    const html = await response.clone().text();
    const assetUrls = Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g), ([, path]) =>
      new URL(path, SHELL_URL),
    ).filter((url) =>
      url.origin === self.location.origin &&
      url.href.startsWith(APP_SCOPE) &&
      /\.(?:css|js|svg|webmanifest)(?:$|\?)/i.test(url.href),
    );

    await Promise.all(assetUrls.map(async (url) => {
      const asset = await fetch(url.href, { cache: 'reload' });
      if (!asset.ok) throw new Error(`App shell asset request failed: ${url.href}`);
      await cache.put(url.href, asset);
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const oldCaches = await caches.keys();
    await Promise.all(oldCaches
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Leave APIs and non-GET requests entirely to the network.
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.split('/').includes('api')
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(SHELL_URL, response.clone());
        }
        return response;
      } catch {
        return (await caches.open(CACHE_NAME)).match(SHELL_URL) ?? Response.error();
      }
    })());
    return;
  }

  if (!url.href.startsWith(APP_SCOPE)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && ['script', 'style', 'image', 'font', 'worker'].includes(request.destination)) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
