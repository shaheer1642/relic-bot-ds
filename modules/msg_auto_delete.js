const { client } = require('./discord_client.js');
const { db } = require('./db_connection.js');
const JSONbig = require('json-bigint');

client.on('ready', () => {
    db.query(`SELECT * FROM discord_msg_auto_delete`).then(res => {
        res.rows.forEach(row => {
            schedule_deletion(row)
        })
        clean_db()
    }).catch(console.error)
})

function db_schedule_msg_deletion(message_id, channel_id, delete_timeout) {
    db.query(`
        INSERT INTO discord_msg_auto_delete (message_id, channel_id, delete_timestamp) 
        VALUES ('${message_id}','${channel_id}',${new Date().getTime() + delete_timeout})
    `).catch(console.error)
}

function schedule_deletion(db_obj) {
    if (process.env.ENVIRONMENT_TYPE != 'prod') return
    setTimeout(async () => {
        const cnl = client.channels.cache.get(db_obj.channel_id) || await client.channels.fetch(db_obj.channel_id).catch(console.error)
        if (!cnl) return
        const msg = cnl.messages.cache.get(db_obj.message_id) || await cnl.messages.fetch(db_obj.message_id).catch(console.error)
        if (!msg) return
        msg.delete().then(() => db.query(`DELETE FROM discord_msg_auto_delete WHERE id = ${db_obj.id}`).catch(console.error)).catch(console.error)
    }, db_obj.delete_timestamp - new Date().getTime());
}

function clean_db() {
    db.query(`DELETE FROM discord_msg_auto_delete WHERE delete_timestamp < ${new Date().getTime()}`).then(res => {
        console.log('[msg_auto_delete] purged', res.rowCount, 'messages from db')
    }).catch(console.error)
}

db.on('notification', async (notification) => {
    if (notification.channel == 'discord_msg_auto_delete_insert') {
        schedule_deletion(JSONbig.parse(notification.payload))
    }
})

module.exports = {
    db_schedule_msg_deletion
}