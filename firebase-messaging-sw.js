// firebase-messaging-sw.js
// Ye file aapke site ke ROOT me honi chahiye (jahan index.html hai), kyunki
// user app isse '/firebase-messaging-sw.js' path se register karta hai.
// Iska kaam: jab app band ho ya background me ho, tab bhi phone par
// notification dikhana (FCM background message handling).

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Same config jo MOVIE_USER_APP me hai
firebase.initializeApp({
    apiKey: "AIzaSyAVjzYmGN_HlsC-srlvOVB0M9S2qoei3hs",
    authDomain: "naikdesitonamet.firebaseapp.com",
    databaseURL: "https://naikdesitonamet-default-rtdb.firebaseio.com",
    projectId: "naikdesitonamet",
    storageBucket: "naikdesitonamet.firebasestorage.app",
    messagingSenderId: "32822181148",
    appId: "1:32822181148:web:48c0fd061a213b71a28ed9",
    measurementId: "G-BCNDRX1E45"
});

const messaging = firebase.messaging();

// Jab app background me ho ya band ho, ye handler chalega aur
// OS-level notification dikhayega (Android/desktop Chrome par).
messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || 'New Update';
    const options = {
        body: (payload.notification && payload.notification.body) || '',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { click_action: (payload.data && payload.data.click_action) || '/' }
    };
    self.registration.showNotification(title, options);
});

// Notification par tap karne par app khol do
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.click_action) || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
            const hadWindow = clientsArr.find((c) => c.url.includes(self.location.origin));
            if (hadWindow) return hadWindow.focus();
            return clients.openWindow(url);
        })
    );
});
