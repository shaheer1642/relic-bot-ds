// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
    apiKey: "AIzaSyAxDsMVypgqkrY31cJici7P-KsISDkb5-Y",
    authDomain: "gaussprime-2e46e.firebaseapp.com",
    projectId: "gaussprime-2e46e",
    storageBucket: "gaussprime-2e46e.appspot.com",
    messagingSenderId: "527087624830",
    appId: "1:527087624830:web:117b4bb3f5de6de5ad6e2f",
    measurementId: "G-WFL1P9NTJX"
};

firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// messaging.onBackgroundMessage(function(payload) {
//   console.log('Received background message ', payload);

//   const notificationTitle = payload.data.title;
//   const notificationOptions = {
//     body: payload.data.body,
//   };

//   self.registration.showNotification(notificationTitle,
//     notificationOptions);
// });