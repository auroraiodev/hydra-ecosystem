self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || 'Nueva notificación - Hydra';
    const options = {
      body: payload.body || '',
      icon: payload.icon || '/android-icon-192x192.png',
      badge: payload.badge || '/favicon-32x32.png',
      data: {
        url: payload.url || '/'
      },
      vibrate: [200, 100, 200, 100, 400],
      tag: payload.tag || 'hydra-notification',
      renotify: true,
      requireInteraction: true,
      actions: payload.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Hydra Collectables', {
        body: text,
        icon: '/android-icon-192x192.png',
        badge: '/favicon-32x32.png',
        vibrate: [200, 100, 200],
        tag: 'hydra-notification',
        renotify: true,
        requireInteraction: true
      })
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
