// public/sw.js
self.addEventListener("install", (event) => {
    console.log("[ServiceWorker] Installed");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[ServiceWorker] Activated");
});

self.addEventListener("fetch", (event) => {
    // Future: Add caching here if needed
});
