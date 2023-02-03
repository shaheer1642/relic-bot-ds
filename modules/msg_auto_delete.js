const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const JSONbig = require('json-bigint');

client.on('ready', () => {
    db.query(`SELECT * FROM discord_msg_auto_delete`).then(res => {
        res.rows.forEach(row => {
            schedule_deletion(row)
        })
    })
})

function db_schedule_msg_deletion(delete_timestamp, message_id, channel_id) {
    db.query(`INSERT INTO discord_msg_auto_delete (message_id, channel_id, delete_timestamp) VALUES ('${message_id}','${channel_id}',${delete_timestamp})`).catch(console.error)
}

function schedule_deletion(db_obj) {
    setTimeout(async () => {
        const cnl = client.channels.cache.get(db_obj.channel_id) || await client.channels.fetch(db_obj.channel_id).catch(console.error)
        if (!cnl) return
        const msg = cnl.messages.cache.get(db_obj.message_id) || await cnl.messages.fetch(db_obj.message_id).catch(console.error)
        if (!msg) return
        msg.delete().catch(console.error)
        db.query(`DELETE FROM discord_msg_auto_delete WHERE id = ${db_obj.id}`).catch(console.error)
    }, db_obj.delete_timestamp - db_obj.creation_timestamp);
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    console.log('[warframe_hub] db notification: ',payload)

    if (notification.channel == 'discord_msg_auto_delete_insert') {
        schedule_deletion(payload)
    }
})

module.exports = {
    db_schedule_msg_deletion
}