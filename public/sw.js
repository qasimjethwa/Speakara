/* Speakara service worker: keeps the app usable offline after a visit, so the downloaded Arabic voice works
   without a network. Same-origin GET only; API routes, auth and other origins are never touched.
   It deliberately does NOT intercept background requests the browser may cancel (React Server Component data,
   prefetches, uncached chunks): intercepting those made Firefox report "ServiceWorker ... unexpected error".
   - Page loads: network-first, falling back to the last cached copy when offline.
   - App chunks (/_next/static): copied into the cache in the background; served from it only to pages that were
     loaded from the cache. Voice runtime (/vendor): served from cache when present. */
const CACHE = "speakara-app-v2";
/** Pages served from the cache because the network failed; their scripts must come from the cache too. */
const offlineClients = new Set();
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("speakara-app-") && k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  if (url.searchParams.has("_rsc") || req.headers.get("RSC") || req.headers.get("Next-Router-Prefetch")) return;
  const vendor = url.pathname.startsWith("/vendor/");
  const isStatic = url.pathname.startsWith("/_next/static/");
  // Voice runtime files: always from cache when present (requested by the voice worker, never cancelled).
  // App chunks: intercepted only for pages that were themselves loaded from the offline cache.
  if (vendor || (isStatic && (offlineClients.has(e.clientId) || self.navigator.onLine === false))) {
    e.respondWith((async () => {
      const hit = await caches.match(req, { ignoreVary: true });   // every cache, including the voice cache
      if (hit) return hit;
      try { return await fetch(req); } catch { return Response.error(); }
    })().catch(() => Response.error()));
    return;
  }
  if (isStatic) {
    e.waitUntil((async () => {
      if (await caches.match(req, { ignoreVary: true })) return;
      const res = await fetch(req).catch(() => null);
      if (res?.ok) await (await caches.open(CACHE)).put(req, res).catch(() => {});
    })());
    return;
  }
  if (req.mode !== "navigate") return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic") { const c = await caches.open(CACHE); c.put(req, res.clone()).catch(() => {}); }
      return res;
    } catch {
      if (e.resultingClientId) offlineClients.add(e.resultingClientId);
      return (await caches.match(req, { ignoreVary: true })) ?? (await caches.match(url.pathname, { ignoreSearch: true, ignoreVary: true })) ?? Response.error();
    }
  })().catch(() => Response.error()));
});
