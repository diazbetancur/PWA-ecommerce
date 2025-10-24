/* Basic Firebase Messaging SW placeholder. You can customize when wiring AngularFire Messaging.
This file will be picked by the browser at /firebase-messaging-sw.js if you enable messaging. */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.notification?.title || 'Notification';
  const options = {
    body: data.notification?.body || '',
    icon: data.notification?.icon || '/icons/icon-192x192.png',
    data: data.data || {},
  };
  event.waitUntil(globalThis.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || '/';
  event.waitUntil(globalThis.clients.openWindow(target));
});
