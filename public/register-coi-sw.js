// Register the service worker for cross-origin isolation
(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./coi-serviceworker.js')
      .then(() => console.log('COI ServiceWorker registered'))
      .catch(err => console.error('COI ServiceWorker registration failed', err));
  } else {
    console.warn('Service workers are not supported in this browser');
  }
})(); 