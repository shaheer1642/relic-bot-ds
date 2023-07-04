const { client } = require("./discord_client")

const cross_channels = {
    '1124833586487513200': [],
    '1124833295734145074': []
}

client.on('messageCreate',(message) => {
    if (message.author?.bot) return
    if (Object.keys(cross_channels).includes(message.channel.id)) {
        cross_channels[message.channel.id].push({
            original_message_id: message.id,
            reference_messages: []
        })
        Object.keys(cross_channels).filter(id => id != message.channel.id).forEach(channel_id => {
            var execute_send = true
            if (message.type == 'REPLY') {
                const reference_message_id = cross_channels[message.channel.id].find(m => m.original_message_id == message.reference.messageId)?.reference_messages.find(o => o.channel_id == channel_id)?.message_id
                if (reference_message_id) {
                    execute_send = false
                    client.channels.cache.get(channel_id)?.messages.cache.get(reference_message_id)?.reply({
                        ...message,
                        content: `**[${message.guild.name}] ${message.member.displayName || message.member.nickname || message.author.username}:** ${message.content}`,
                        files: Array.from(message.attachments.values()),
                    }).then(cross_message => {
                        cross_channels[message.channel.id] = cross_channels[message.channel.id].map(o => o.original_message_id == message.id ? {...o, reference_messages: [...o.reference_messages, {channel_id: cross_message.channel.id, message_id: cross_message.id}]} : o)
                        cross_channels[channel_id].push({
                            original_message_id: cross_message.id,
                            reference_messages: [{
                                channel_id: message.channel.id,
                                message_id: message.id
                            }]
                        })
                    }).catch(console.error)
                }
            } 
            if (execute_send) {
                client.channels.cache.get(channel_id)?.send({
                    ...message,
                    content: `**[${message.guild.name}] ${message.member.displayName || message.member.nickname || message.author.username}:** ${message.content}`,
                    files: Array.from(message.attachments.values()),
                }).then(cross_message => {
                    cross_channels[message.channel.id] = cross_channels[message.channel.id].map(o => o.original_message_id == message.id ? {...o, reference_messages: [...o.reference_messages, {channel_id: cross_message.channel.id, message_id: cross_message.id}]} : o)
                    cross_channels[channel_id].push({
                        original_message_id: cross_message.id,
                        reference_messages: [{
                            channel_id: message.channel.id,
                            message_id: message.id
                        }]
                    })
                }).catch(console.error)
            }
        })
    }
})

client.on('messageUpdate',(oldMessage, message) => {
    if (message.author?.bot) return
    if (Object.keys(cross_channels).includes(message.channel.id)) {
        cross_channels[message.channel.id].find(o => o.original_message_id == message.id).reference_messages.forEach(reference_message => {
            client.channels.cache.get(reference_message.channel_id)?.messages.cache.get(reference_message.message_id)?.edit({
                content: `**[${message.guild.name}] ${message.member.displayName || message.member.nickname || message.author.username}:** ${message.content}`,
            }).catch(console.error)
        })
    }
})