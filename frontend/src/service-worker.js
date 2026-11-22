/* eslint-disable no-restricted-globals */

// Service worker source. Create React App compiles this with Workbox
// (InjectManifest) into build/service-worker.js for production builds only.

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

clientsClaim();

// Precache the build output; drop caches left behind by older builds.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation: serve the app shell, except for API calls and direct file requests.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${process.env.PUBLIC_URL}/index.html`), {
    denylist: [/^\/api\//, /\/[^/?]+\.[^/]+$/],
  })
);

// Book covers come from external hosts (Google Books, Open Library, LibraryThing).
// API data is deliberately not cached: the library is edited often and must stay fresh.
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin !== self.location.origin,
  new CacheFirst({
    cacheName: 'book-covers',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7, purgeOnQuotaError: true }),
    ],
  })
);

// Sent by PwaUpdatePrompt when the user taps "Update now".
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
