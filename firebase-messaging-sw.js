// ═══════════════════════════════════════════════════════════════
// AirWays — Firebase Messaging Service Worker
// File: /firebase-messaging-sw.js
// DEPLOY: Put this file in the ROOT of your GitHub repo
//         (same level as index.html)
// ═══════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ── PASTE YOUR FIREBASE CONFIG HERE ────────────────────────────
// (same config as in index.html Admin Panel)
firebase.initializeApp({
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// ── BACKGROUND PUSH HANDLER ────────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[AirWays SW] Background push received:', payload);
  const { title, body } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title || 'AirWays', {
    body:    body || '',
    icon:    '/icon-192.png',
    badge:   '/badge-72.png',
    tag:     data.reqId || 'airways-notif',
    data:    data,
    actions: [
      { action: 'view', title: 'View in AirWays' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
  });
});

// ── NOTIFICATION CLICK HANDLER ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const appUrl = 'https://g-money63.github.io/airways-mro';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url.includes('airways-mro') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(appUrl);
      })
  );
});

// ── CACHE STRATEGY (offline support) ──────────────────────────
const CACHE_NAME = 'airways-v1';
const CACHE_URLS = ['/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('index.html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
  }
});
