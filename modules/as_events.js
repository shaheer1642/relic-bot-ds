const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js');
const { df_send_message } = require('./discord_functions.js');
const { db_schedule_msg_deletion } = require('./msg_auto_delete.js');

const channel_ids = {
    moderator: '909247527201689680',
    event_submission: '1095422056813834291'
}

client.on('messageCreate',(message) => {
    if (message.guild?.id == '865904902941048862') {
        if (message.channel?.id == channel_ids.event_submission) {
            const screenshots = message.attachments.map(attachment => attachment.url).join('\n')
            df_send_message({
                embeds: [{
                    title: 'New Event Submission',
                    author: message.member,
                    description: `${message.content}${screenshots ? `\n\n**Attached Screenshots**\n${screenshots}` : ''}`,
                    color: '#7243c4'
                }]
            }, channel_ids.moderator).then((res) => {
                message.channel.send({content: `<@${message.author.id}> Your submission has been forwarded. Thank you!`}).then(res => {
                    db_schedule_msg_deletion(res.id,res.channel.id,15000)
                }).catch(console.error)
            }).catch((err) => {
                message.channel.send({content: `<@${message.author.id}> Some error occured forwarding your submission. Please try again`}).then(res => {
                    db_schedule_msg_deletion(res.id,res.channel.id,15000)
                }).catch(console.error)
            })
            db_schedule_msg_deletion(message.id,message.channel.id,2000)
        }
    }
})