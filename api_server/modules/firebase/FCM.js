const admin = require("firebase-admin");
const {initializeApp} = require('firebase-admin/app');
const {getMessaging} = require('firebase-admin/messaging');
const { as_users_fcm_tokens, removeUserToken } = require("./as_users_fcm_tokens");

const firebaseApp = initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIAL))
}, 'GaussPrime');
const messaging = getMessaging(firebaseApp);

function pushNotify({user_ids, title , body}) {
    console.log('[firebase/FCM.pushNotify] called')
    const tokens = user_ids.reduce((arr,id) => arr.concat(as_users_fcm_tokens[id]),[]).filter(o => o != undefined)
    console.log('[firebase/FCM.pushNotify] tokens = ',tokens)
    if (tokens.length == 0) return console.log('[firebase/FCM.pushNotify] no tokens to notify')
    const fcm_tokens = user_ids.reduce((arr,id) => arr.concat(as_users_fcm_tokens[id]),[]).filter(o => o != undefined)
    messaging.sendMulticast({
        tokens: fcm_tokens,
        notification: {
            title: title,
            body: body
        },
    }).then((res) => {
        console.log('[firebase/FCM] Sent push notification; response = ',JSON.stringify(res));
        res.responses.forEach((response,index) => {
            if (response.error) removeUserToken(fcm_tokens[index])
        })
    }).catch((error) => {
        console.log('[firebase/FCM] Error sending notification:', error);
    });
}

module.exports = {
    pushNotify
}