const {db} = require('../db_connection')
const {event_emitter} = require('../event_emitter')
const JSONbig = require('json-bigint');

var as_users_fcm_tokens = {}

event_emitter.on('db_connected', () => {
    updateUsersTokens()
})

function updateUsersTokens() {
    db.query(`SELECT * FROM as_push_notify`).then(res => {
        res.rows.forEach(row => {
            if (!as_users_fcm_tokens[row.user_id]) as_users_fcm_tokens[row.user_id] = []
            as_users_fcm_tokens[row.user_id].push(row.fcm_token)
        })
    }).catch(console.error)
}

function removeUserToken(token) {
    db.query(`DELETE FROM as_push_notify WHERE fcm_token = '${token}'`).catch(console.error)
}

db.on('notification',(notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (notification.channel == 'as_push_notify_insert') {
        if (!as_users_fcm_tokens[payload.user_id]) as_users_fcm_tokens[payload.user_id] = []
        as_users_fcm_tokens[payload.user_id].push(payload.fcm_token)
    }
})

module.exports = {
    as_users_fcm_tokens,
    removeUserToken
}