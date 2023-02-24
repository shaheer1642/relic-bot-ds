const {client} = require('./discord_client.js');
const {db} = require('./db_connection.js')
const {timeStringToMs} = require('./extras.js');
const { socket } = require('./socket.js');



client.on('ready', async () => {
    editMainMessage()
})

client.on('interactionCreate', interaction => {
    if (interaction.isButton()) {
        if (interaction.customId.split('.')[0] == 'as_at_get_users_verified') {
            interaction.showModal({
                title: "Get Users Verified",
                custom_id: interaction.customId,
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "time_since",
                            label: "Time since",
                            style: 2,
                            min_length: 1,
                            max_length: 50,
                            placeholder: "1d 3h   --- means --->   1day 3hours\n\nyear=y\nmonth=M\nweek=w\nday=d\nhour=h\nminute=m\nsecond=s",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        }
        if (interaction.customId.split('.')[0] == 'as_at_lift_ban') {
            interaction.showModal({
                title: "Lift Global Ban",
                custom_id: 'as_at_lift_ban',
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "username",
                            label: "Username",
                            style: 2,
                            min_length: 1,
                            max_length: 50,
                            placeholder: "Type user's in-game name, or discord id",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId.split('.')[0] == 'as_at_get_users_verified') {
            getUsersVerified(interaction.fields.getTextInputValue('time_since').trim()).then(payload => interaction.reply(payload).catch(console.error)).catch(console.error)
        }
        if (interaction.customId.split('.')[0] == 'as_at_lift_ban') {
            socket.emit('allsquads/admincommands/liftglobalban', {discord_id: interaction.user.id, identifier: interaction.fields.getTextInputValue('username').trim()}, res => {
                if (res.code == 200) {
                    interaction.reply({
                        content: 'Ban has been lifted',
                        ephemeral: true
                    }).catch(console.error)
                } else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        }
    }
})

async function getUsersVerified(time_since) {
    return new Promise((resolve,reject) => {
        var ms = timeStringToMs(time_since)
        if (!ms) return resolve({content: 'Invalid input for time_since', ephemeral: true})
        db.query(`
            SELECT * FROM tradebot_users_list WHERE registered_timestamp > ${new Date().getTime() -  ms} ORDER BY registered_timestamp DESC;
        `).then(res => {
            const users = res.rows
            if (users.length > 0) {
                return resolve({
                    content: ' ',
                    embeds: [{
                        title: `${res.rows.length} users verified in last ${time_since}`,
                        description: users.map(user => user.ingame_name).join(', ').substring(0, 1999)
                    }],
                    ephemeral: true
                })
            } else return resolve({content: `0 users returned for last ${time_since}`, ephemeral: true})
        }).catch(console.error)
    })
}

async function editMainMessage() {
    const messages = [{
        channel_id: '1063435050802237540',
        message_id: '1063435290494111764'
    },{
        channel_id: '1078705376062611516', // dev
        message_id: '1078705475190792222'  // dev
    }]
    messages.forEach(async msg => {
        const channel = client.channels.cache.get(msg.channel_id) || await client.channels.fetch(msg.channel_id).catch(console.error)
        if (!channel) return
        const message = channel.messages.cache.get(msg.message_id) || await channel.messages.fetch(msg.message_id).catch(console.error)
        if (!message) return
        message.edit({
            content: ' ',
            embeds: [{
                description: 'List of admin tools'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    style: 3,
                    label: 'Get Users Verified',
                    custom_id: 'as_at_get_users_verified'
                },{
                    type: 2,
                    style: 3,
                    label: 'Lift Global Ban',
                    custom_id: 'as_at_lift_ban'
                },]
            }]
        }).catch(console.error)
    })
}

function error_codes_embed(response,discord_id) {
    if (response.code == 499) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> Please verify your Warframe account to access this feature\nClick Verify to proceed`,
                color: 'YELLOW'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Verify",
                    style: 1,
                    custom_id: `tb_verify`
                }]
            }],
            ephemeral: true
        }
    } else if (response.code == 399) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message}`,
                color: 'GREEN'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Join Existing",
                    style: 3,
                    custom_id: `as_sb_sq_merge_true_${response.squad_id}`
                },{
                    type: 2,
                    label: "Host New",
                    style: 1,
                    custom_id: `as_sb_sq_merge_false$${response.squad_string}`
                }]
            }],
            ephemeral: true
        }
    } else if (response.code == 299) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message}`,
                color: 'GREEN'
            }],
            ephemeral: true
        }
    } else {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error || 'error'}`,
                color: 'RED'
            }],
            ephemeral: true
        }
    }
}