// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "VITE_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "VITE_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: "VITE_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: "VITE_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "VITE_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: "VITE_FIREBASE_APP_ID_PLACEHOLDER"
});


// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || (payload.data && payload.data.title) || 'RG Basket';
  const imageUrl = payload.notification?.image || (payload.data && (payload.data.image || payload.data.imageUrl)) || null;
  const path = (payload.data && payload.data.path) || '/';
  
  const notificationOptions = {
    body: payload.notification?.body || (payload.data && payload.data.body) || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    image: imageUrl || undefined,
    tag: 'rgbasket-notification', // Prevent piling up by using a single tag
    renotify: true, // Vibrate/notify even if replacing
    data: {
      click_action: path
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click handler to open/focus window and navigate to the target path
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const clickAction = event.notification.data?.click_action || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find if there is already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (clickAction && 'navigate' in client) {
            client.navigate(clickAction);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(clickAction);
      }
    })
  );
});
