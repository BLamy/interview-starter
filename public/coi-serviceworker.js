// This is a service worker for cross-origin isolation
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const requestUrl = new URL(e.request.url);
  if (requestUrl.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
    );
  } else {
    e.respondWith(fetch(e.request));
  }
}); 