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
    if (notification.channel == 'tradebot_users_list_insert') {
        as_users_list[payload.discord_id] = payload
    }
    if (notification.channel == 'tradebot_users_list_update') {
        as_users_list[payload[0].discord_id] = payload[0]
    }
})

module.exports = {
    as_users_list
}