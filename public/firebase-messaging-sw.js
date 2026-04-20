importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyArGFp6Kb1RhSqxW0f1BV_E_PODMVeOYlE",
  authDomain: "ppmh-notif.firebaseapp.com",
  projectId: "ppmh-notif",
  storageBucket: "ppmh-notif.firebasestorage.app",
  messagingSenderId: "926177679010",
  appId: "1:926177679010:web:a4cd1c577634091424a9fb",
  measurementId: "G-5G7Y2KF2XX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-ppmh.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
