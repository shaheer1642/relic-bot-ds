const {db} = require('../db_connection')
const {event_emitter} = require('../event_emitter')

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
    if (['tradebot_users_list_insert','tradebot_users_list_update','tradebot_users_list_delete'].includes(notification.channel)) {
        updateUsersList()
    }
})

module.exports = {
    as_users_list
}