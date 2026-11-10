// Logs process memory and discord.js cache sizes so memory growth can be tracked in the host's logs.
const { client } = require('./discord_client.js');

const MB = bytes => `${Math.round(bytes / 1048576)}MB`

function logMemoryStats() {
    const mem = process.memoryUsage()
    let members = 0, presences = 0, messages = 0
    client.guilds.cache.forEach(guild => {
        members += guild.members.cache.size
        presences += guild.presences.cache.size
    })
    client.channels.cache.forEach(channel => {
        if (channel.messages) messages += channel.messages.cache.size
    })
    console.log(`[memory_stats] rss=${MB(mem.rss)} heapUsed=${MB(mem.heapUsed)} heapTotal=${MB(mem.heapTotal)} external=${MB(mem.external)}`
        + ` | guilds=${client.guilds.cache.size} channels=${client.channels.cache.size} users=${client.users.cache.size}`
        + ` members=${members} presences=${presences} messages=${messages}`)
}

client.once('ready', () => setTimeout(logMemoryStats, 300000))
setInterval(logMemoryStats, 3600000)

module.exports = { logMemoryStats }
