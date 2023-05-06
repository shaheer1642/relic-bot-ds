const {db} = require('../db_connection')
const JSONbig = require('json-bigint');
const { event_emitter } = require('../event_emitter');

var as_users_list = {}
var as_users_list_discord = {}

db.on('connected', () => {
    updateUsersList()
})

function updateUsersList() {
    db.query(`SELECT * FROM as_users_list`).then(res => {
        res.rows.forEach(row => {
            as_users_list[row.user_id] = row
            if (row.discord_id) as_users_list_discord[row.discord_id] = row
        })
    }).catch(console.error)
}

function updateUser(user_id, notification) {
    db.query(`SELECT * FROM as_users_list WHERE user_id = '${user_id}'`).then(res => {
        res.rows.forEach(row => {
            if (notification == 'as_users_list_insert') {
                if (row.discord_id) {
                    if (row.ingame_name) {
                        event_emitter.emit('allSquadsNewUserVerified',row)
                    }
                }
            }
            if (notification == 'as_users_list_update') {
                if (row.discord_id) {
                    if (row.ingame_name != as_users_list[row.user_id]?.ingame_name) {
                        event_emitter.emit('allSquadsUserUpdatedIGN',row)
                    }
                }
            }

            as_users_list[row.user_id] = row
            if (row.discord_id) as_users_list_discord[row.discord_id] = row
        })
    }).catch(console.error)
}

db.on('notification',(notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (['as_users_list_insert','as_users_list_update'].includes(notification.channel)) {
        updateUser(payload.user_id,notification.channel)
    }
})

module.exports = {
    as_users_list,
    as_users_list_discord
}