const {db} = require('../db_connection')
const {event_emitter} = require('../event_emitter')
const JSONbig = require('json-bigint');

var as_users_list = {}
var as_users_list_discord = {}

db.on('connected', () => {
    updateUsersList()
})

function updateUsersList() {
    console.log('[as_users_list.updateUsersList] called')
    db.query(`SELECT * FROM as_users_list`).then(res => {
        res.rows.forEach(row => {
            as_users_list[row.user_id] = row
            if (row.discord_id) as_users_list_discord[row.discord_id] = row
        })
        console.log('[as_users_list.updateUsersList] finished')
    }).catch(console.error)
}

function updateUser(user_id) {
    db.query(`SELECT * FROM as_users_list WHERE user_id = '${user_id}'`).then(res => {
        res.rows.forEach(row => {
            as_users_list[row.user_id] = row
            if (row.discord_id) as_users_list_discord[row.discord_id] = row
            notifySocketOnUpdate(row)
        })
    }).catch(console.error)
}

function notifySocketOnUpdate(user) {
    // delete user.login_tokens
    // delete user.email
    // delete user.password
    // delete user.discord_token
    event_emitter.emit('socketNotifyAll',{
        event: 'allsquads/users/update',
        data: {
            user_id: user.user_id,
            ingame_name: user.ingame_name
        }
    })
}

db.on('notification',(notification) => {
    const payload = JSONbig.parse(notification.payload);
    if (['as_users_list_insert','as_users_list_update'].includes(notification.channel)) {
        updateUser(payload.user_id)
    }
})

module.exports = {
    as_users_list,
    as_users_list_discord
}