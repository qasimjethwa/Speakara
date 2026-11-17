/* Speakara service worker: keeps the app usable offline after a visit, so the downloaded Arabic voice works
   without a network. Same-origin GET only; API routes, auth and other origins are never touched.
   - /_next/static and /vendor: cache-first (file names are versioned, so they never change).
   - Pages and other same-origin GETs: network-first, falling back to the last cached copy when offline. */
const CACHE = "speakara-app-v1";
const VERSION = 2; // bump to replace an installed worker
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;
  const immutable = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/vendor/");
  e.respondWith((async () => {
    if (immutable) {
      const hit = await caches.match(req, { ignoreVary: true });   // searches every cache, including the voice cache
      if (hit) return hit;
      // A cancelled or failed request must surface as an ordinary network error, never a rejected respondWith.
      try {
        const res = await fetch(req);
        if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()).catch(() => {}); }
        return res;
      } catch { return Response.error(); }
    }
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic") { const c = await caches.open(CACHE); c.put(req, res.clone()).catch(() => {}); }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreVary: true }) ?? (req.mode === "navigate" ? await caches.match(url.pathname, { ignoreSearch: true, ignoreVary: true }) : undefined);
      if (hit) return hit;
      void err; return Response.error();
    }
  })());
});
