const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');

function df_send_message(payload, channel_id) {
    return new Promise(async (resolve, reject) => {
        const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
        if (!channel) return reject('Could not find that channel')
        channel.send(payload).then(res => {
            resolve(res)
        }).catch(err => {
            reject(err)
        })
    })
}

module.exports = {
    df_send_message
}