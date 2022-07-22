
const {client} = require('./discord_client.js');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore,mod_log} = require('./extras.js');

async function computeServerStats(message, args) {
    try {
        var edit_msg = await message.channel.send('Collecting data, this may take a few seconds...').catch(err => console.log(err))
        var offset = args[0] || 7
    
        var timestamp = new Date().setHours(0,0,0,0) - (offset * 86400000)
    
        //var channel_msgs = {}
    
        const channels = await client.guilds.cache.get(message.guildId).channels.fetch().catch(err => console.log(err))
    
        console.log(channels.size)
        
        var user_msgs = {}

        var channel_data = await Promise.all(channels.map(async (channel,channelId) => {
            if (channel.type == 'GUILD_CATEGORY') return {channel: channelId, messages: 0}
            if (channel.type == 'GUILD_VOICE') return {channel: channelId, messages: 0}
            var last_msg = await channel.messages.fetch({limit: 1}).catch(err => console.log(err))
            last_msg.forEach(msg => last_msg = msg)
            if (last_msg.createdTimestamp < timestamp)
                return {channel: channelId, messages: 0}
            var all_msgs_ids = []
            var last_id = last_msg.id
            all_msgs_ids.push(last_id)
            var stopFlag = 0
            while(!stopFlag) {
                const messages = await channel.messages.fetch({limit: 100, before: last_id}).catch(err => console.log(err))
                for (var [messageId,message] of messages) {
                    last_id = messageId
                    if (message.createdTimestamp < timestamp) {
                        stopFlag = 1
                        break
                    }
                    //console.log(message.createdTimestamp)
                    if (!all_msgs_ids.includes(messageId))
                        all_msgs_ids.push(messageId)
                    if (!message.author.bot) {
                        if (!user_msgs[message.author.id]) {
                            user_msgs[message.author.id] = 0
                        }
                        user_msgs[message.author.id]++
                    }
                }
                if (messages.size < 100)
                    break
            }
            console.log('total msgs',all_msgs_ids.length)
            return {channel: channelId, messages: all_msgs_ids.length}
            //channel_msgs[channelId] = all_msgs_ids.length
        })
        );
        channel_data = channel_data.sort(dynamicSortDesc("messages"))
        console.log(channel_data)
        var user_msgs_sorted = []
        for(const userId in user_msgs) {
            user_msgs_sorted.push({
                user: userId,
                messages: user_msgs[userId]
            })
        }
        user_msgs_sorted = user_msgs_sorted.sort(dynamicSortDesc("messages"))
        console.log(user_msgs_sorted)
        var embed = {
            title: `Activity in past ${offset} days`,
            description: ''
        }
        channel_data.forEach(obj => {
            if (obj.messages == 0) return
            embed.description += `<#${obj.channel}>: ${obj.messages} msgs\n`
        })
        embed.description += '\n-----\n\n'
        user_msgs_sorted.forEach(obj => {
            embed.description += `<@${obj.user}>: ${obj.messages} msgs\n`
        })
        if (embed.description.length > 4096)
            edit_msg.edit({content: 'Embed is too long to send'}).catch(err => console.log(err))
        else
            edit_msg.edit({content: ' ', embeds: [embed]}).catch(err => console.log(err))
    } catch (e) {
        console.log(e)
        message.channel.send({content: `Sorry, some error occured\n${JSON.stringify(e.stack? e.stack:e)}`})
        return
    }
}

module.exports = {
    computeServerStats
}