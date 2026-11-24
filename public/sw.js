const cacheName = "daigo-v1"

self.addEventListener("install", (e) => {
  e.waitUntil(precache())
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(cleanup())
})

async function precache() {
  try {
    const cache = await caches.open(cacheName)
    await cache.add("/offline")
  } catch { return }
}

async function cleanup() {
  const names = await caches.keys()
  await Promise.all(names.filter((n) => n !== cacheName).map((n) => caches.delete(n)))
  await self.clients.claim()
}

async function pageOrOffline(request) {
  try { return await fetch(request) } catch { return (await caches.match("/offline")) || Response.error() }
}

async function staticFile(request) {
  const hit = await caches.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) (await caches.open(cacheName)).put(request, res.clone())
  return res
}

// api calls, logins and sockets never go through here on purpose
self.addEventListener("fetch", (e) => {
  const { request } = e
  const url = new URL(request.url)
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return
  if (request.mode === "navigate") e.respondWith(pageOrOffline(request))
  else if (url.pathname.startsWith("/_next/static/")) e.respondWith(staticFile(request))
})
