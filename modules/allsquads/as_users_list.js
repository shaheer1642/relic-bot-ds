const {db} = require('../db_connection')
const {event_emitter} = require('../event_emitter')
const JSONbig = require('json-bigint');

var as_users_list = {}

event_emitter.on('db_connected', () => {
    updateUsersList()
})

function updateUsersList() {
    db.query(`SELECT * FROM tradebot_users_list`).then(res => {
        res.rows.forEach(row => {
            as_users_list[row.discord_id] = row
        })
    }).catch(console.error)
}

db.on('notification',(notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (['tradebot_users_list_insert','tradebot_users_list_update','tradebot_users_list_delete'].includes(notification.channel)) {
        updateUsersList()
    }
    if (['tradebot_users_list_insert'].includes(notification.channel)) {
        event_emitter.emit('allSquadsNewUserVerified', payload)
    }
    if (['tradebot_users_list_update'].includes(notification.channel)) {
        if (payload[0].ingame_name != payload[1].ingame_name) {
            event_emitter.emit('allSquadsUserUpdatedIGN', payload[0])
        }
    }
})

module.exports = {
    as_users_list
}