const { db } = require('../db_connection')
const { client } = require('../discord_client');

var discord_servers_ping_channel = {}

db.on('connected', () => {
    updateObject()
})

function updateObject() {
    db.query(`SELECT * FROM discord_servers_ping_channel`).then(res => {
        res.rows.forEach(row => {
            discord_servers_ping_channel[row.guild_id] = row.channel_id
        })
    }).catch(console.error)
}

function getServerPingChannel(channel_id) {
    console.log('[getServerPingChannel called')
    const channel = client.channels.cache.get(channel_id)
    if (!channel || !discord_servers_ping_channel[channel.guildId]) return undefined
    // console.log({
    //     ping_channel_id: discord_servers_ping_channel[channel.guildId],
    //     redirect_channel_id: channel_id
    // })
    return {
        ping_channel_id: discord_servers_ping_channel[channel.guildId],
        redirect_channel_id: channel_id
    }
}

db.on('notification', (notification) => {
    if (['discord_servers_ping_channel_insert', 'discord_servers_ping_channel_update', 'discord_servers_ping_channel_delete'].includes(notification.channel)) {
        updateObject()
    }
})

module.exports = {
    getServerPingChannel
}