/* SHOHIN MOVIE — SERVICE WORKER */

"use strict";

const CACHE_NAME = "shohin-movie-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/storage.js",
  "./js/data.js",
  "./js/cards.js",
  "./js/navigation.js",
  "./js/search.js",
  "./js/details.js",
  "./js/app.js",
  "./assets/logo/logo.svg",
  "./assets/icons/icon.svg"
];

/* INSTALL */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        APP_FILES.map(async (file) => {
          try {
            const response = await fetch(file, {
              cache: "reload"
            });

            if (response.ok) {
              await cache.put(file, response);
            }
          } catch (error) {
            // Missing files do not prevent installation.
          }
        })
      );

      await self.skipWaiting();
    })()
  );
});

/* ACTIVATE */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames.map(async (name) => {
          if (
            name.startsWith("shohin-movie-") &&
            name !== CACHE_NAME
          ) {
            await caches.delete(name);
          }
        })
      );

      await self.clients.claim();
    })()
  );
});

/* FETCH */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Do not intercept external websites.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Do not handle browser navigation outside this app's scope.
  if (!url.pathname.startsWith(self.registration.scope.replace(url.origin, ""))) {
    return;
  }

  // JSON files: try the network first to receive updated catalog data.
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          const cachedResponse = await caches.match(request);

          if (cachedResponse) {
            return cachedResponse;
          }

          return new Response("Каталог пока недоступен офлайн.", {
            status: 503,
            statusText: "Offline",
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          });
        }
      })()
    );

    return;
  }

  // App pages and assets: use the cache first.
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        // Show the cached home page if navigation fails offline.
        if (request.mode === "navigate") {
          const offlinePage = await caches.match("./index.html");

          if (offlinePage) {
            return offlinePage;
          }
        }

        return new Response("Нет подключения к интернету.", {
          status: 503,
          statusText: "Offline",
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          }
        });
      }
    })()
  );
});