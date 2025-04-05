import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from "firebase/messaging";
import { socket } from '../socket';
import { ISocketResponse } from '../interfaces/ISocketResponse';

const firebaseConfig = {
  apiKey: "AIzaSyAxDsMVypgqkrY31cJici7P-KsISDkb5-Y",
  authDomain: "gaussprime-2e46e.firebaseapp.com",
  projectId: "gaussprime-2e46e",
  storageBucket: "gaussprime-2e46e.appspot.com",
  messagingSenderId: "527087624830",
  appId: "1:527087624830:web:117b4bb3f5de6de5ad6e2f",
  measurementId: "G-WFL1P9NTJX"
};

const firebaseApp = initializeApp(firebaseConfig);
export const messaging = getMessaging(firebaseApp);

export const fetchToken = async (callback: (success: boolean) => void) => {
  return getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_FCM_VAPIDKEY }).then((currentToken) => {
    if (currentToken) {
      // console.log('[Firebase FCM] Current token for client:', currentToken);
      console.log('[FCM] login_token', localStorage.getItem('login_token'))
      socket.emit('allsquads/fcm/token/update', { login_token: localStorage.getItem('login_token'), fcm_token: currentToken }, (res: ISocketResponse) => {
        if (res.code != 200) console.log('[FCM] error', res)
      })
      callback(true);
    } else {
      console.log('[Firebase FCM] No registration token available. Request permission to generate one.');
      callback(false);
    }
  }).catch((err) => {
    console.log('[Firebase FCM] An error occurred while retrieving token. ', err);
  });
}