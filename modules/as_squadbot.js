const {client} = require('./discord_client');
const {db} = require('./db_connection')
const uuid = require('uuid')
const { WebhookClient } = require('discord.js');
const JSONbig = require('json-bigint');
const {socket} = require('./socket')
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./extras.js');
const WorldState = require('warframe-worldstate-parser');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const {event_emitter} = require('./event_emitter')

const server_commands_perms = [
    '253525146923433984', //softy
    '253980061969940481', //leo
    '353154275745988610', //john 
    '385459793508302851' //ady 
]

const webhook_messages = {}
const channels_list = {}
const webhooks_list = {}

const emote_ids = {
    steel_essence: '<:steel_essence:962508988442869800>',
    railjack: '<:railjack:1045456185429594214>',
    hot: '🔥',
    cold: '❄️',
    lith: '<:Lith:962457564493271051>',
    meso: '<:Meso:962457563092361257>',
    neo: '<:Neo:962457562844909588>',
    axi: '<:Axi:962457563423735868>',
}

const default_squads = [{
    squad_string: 'sortie',
    spots: 4,
    members: [],
    emoji: {
        id: '1050156747135909918',
        name: 'Sortie_b'
    },
    is_default: true
},{
    squad_string: 'nightwave',
    spots: 2,
    members: [],
    emoji: {
        id: '1050156747135909918',
        name: 'Sortie_b'
    },
    is_default: true
},{
    squad_string: 'index',
    spots: 4,
    members: [],
    emoji: {
        id: '1050156747135909918',
        name: 'Sortie_b'
    },
    is_default: true
},]

client.on('ready', async () => {
    assign_global_variables().then(() => {
        edit_recruitment_intro()
    }).catch(console.error)
    update_users_list()
})


client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (message.channel.isText() && Object.keys(channels_list).includes(message.channel.id)) {
        if (server_commands_perms.includes(message.author.id) && message.content.toLowerCase().match(/^persist/)) return
        console.log('[squadbot messageCreate] content:',message.content)
        socket.emit('squadbot/squads/create',{message: message.content, discord_id: message.author.id, channel_id: message.channel.id},responses => {
            handleSquadCreateResponses(message.channel.id,message.author.id,responses)
            setTimeout(() => message.delete().catch(console.error), 1000);
        })
    }
    if (message.channel.isThread() && Object.keys(channels_list).includes(message.channel.parent?.id)) {
        if (message.channel.ownerId == client.user.id) {
            socket.emit('squadbot/squads/messageCreate', {
                message_id: message.id,
                discord_id: message.author.id,
                message: message.content,
                thread_id: message.channel.id
            })
        }
    }
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName == 'squad_bot') {
            if (!server_commands_perms.includes(interaction.user.id))
                return interaction.reply('You do not have permission to use this command').catch(console.error)
            await interaction.deferReply().catch(console.error)
            if (interaction.options.getSubcommand() == 'add_server') {
                add_server(interaction.guild.id).then(res => {
                    interaction.editReply({
                        content: ' ',
                        embeds: [{description: `Successfully affiliated with this server\nChannels can be found at <#${res.id}>`, color: 'WHITE'}]
                    }).catch(console.error)
                }).catch(err => {
                    console.log(err)
                    interaction.editReply({
                        content: ' ',
                        embeds: [{description: 'Error occured\n' + err, color: 'WHITE'}]
                    }).catch(console.error)
                })
            }
            if (interaction.options.getSubcommand() == 'remove_server') {
                remove_server(interaction.guild.id).then(res => {
                    interaction.editReply({
                        content: ' ',
                        embeds: [{description: 'Successfully unaffiliated from this server', color: 'WHITE'}]
                    }).catch(console.error)
                }).catch(err => {
                    console.log(err)
                    interaction.editReply({
                        content: ' ',
                        embeds: [{description: 'Error occured\n' + err, color: 'WHITE'}]
                    }).catch(console.error)
                })
            }
        }
    }
    if (interaction.isButton()) {
    }
    if (interaction.isModalSubmit()) {
    }
    if (interaction.isSelectMenu()) {
    }
})

function handleSquadCreateResponses(channel_id,discord_id,responses) {
    if (!Array.isArray(responses)) responses = [responses]
    const payloads = [{content: ' ', embeds: [], ephemeral: false}]
    var k = 0
    var timeout = 5000
    responses.forEach(res => {
        const msg = error_codes_embed(res,discord_id)
        if (res.code != 200) {
            console.log(res)
            if (!msg.components) {
                if (payloads[k].embeds.length == 10) {
                    payloads.push({content: ' ', embeds: [], ephemeral: false})
                    k++;
                }
                payloads[k].embeds.push(...msg.embeds)
            } else {
                timeout = 10000
                payloads.push(msg)
                payloads.push({content: ' ', embeds: [], ephemeral: false})
                k += 2;
            }
        }
    })
    payloads.forEach(payload => {
        if (payload.embeds.length > 0) {
            const webhook_client = new WebhookClient({url: webhooks_list[channel_id]})
            webhook_client.send(payload).catch(console.error) //.then(res => setTimeout(() => webhook_client.deleteMessage(res.id).catch(console.error), timeout)).catch(console.error)
        }
    })
}

function assign_global_variables() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM as_sb_messages; SELECT * FROM as_sb_channels;`)
        .then(res => {
            res[1].rows.forEach((row) => { 
                channels_list[row.channel_id] = row
                webhooks_list[row.channel_id] = row.webhook_url
            })
            res[0].rows.forEach((row) => {
                if (!webhook_messages[row.type]) webhook_messages[row.type] = []
                if (!webhook_messages[row.type].find(obj => obj.m_id == row.message_id)) {
                    webhook_messages[row.type].push({
                        m_id: row.message_id,
                        c_id: row.channel_id,
                        c_type: channels_list[row.channel_id].type,
                        url: webhooks_list[row.channel_id],
                    })
                }
            })
            resolve()
        }).catch(console.error)
    })
}

var users_list = {}
function update_users_list() {
    socket.emit('relicbot/users/fetch',{},(res) => {
        if (res.code == 200) {
            users_list = {}
            res.data.forEach(row => {
                users_list[row.discord_id] = row
            })
        }
    })
}


var timeout_edit_webhook_messages = null
var timeout_edit_webhook_messages_reset = null
var edit_webhook_messages_time_since_last_call = 0
function edit_webhook_messages(squads,with_all_names,name_for_squad_id, single_channel_id) {
    clearTimeout(timeout_edit_webhook_messages)
    timeout_edit_webhook_messages = setTimeout(() => {
        const payload = embed(squads,with_all_names,name_for_squad_id)
        webhook_messages['find_squads_1'].forEach(msg => {
            if (!single_channel_id || single_channel_id == msg.c_id)
                new WebhookClient({url: msg.url}).editMessage(msg.m_id, payload).catch(console.error)
        })
    }, new Date().getTime() - edit_webhook_messages_time_since_last_call > 1000 ? 0 : 500)
    clearTimeout(timeout_edit_webhook_messages_reset)
    timeout_edit_webhook_messages_reset = setTimeout(() => {
        const payload = embed(squads)
        webhook_messages['find_squads_1'].forEach(msg => {
            //if (!single_channel_id || single_channel_id == msg.c_id)
                new WebhookClient({url: msg.url}).editMessage(msg.m_id, payload).catch(console.error)
        })
    }, 3000);
    edit_webhook_messages_time_since_last_call = new Date().getTime()
}

function add_server(guild_id) {
    return new Promise((resolve,reject) => {
        db.query(`INSERT INTO as_sb_guilds (guild_id) VALUES ('${guild_id}')`)
        .then(res => {
            if (res.rowCount == 1) {
                client.guilds.fetch(guild_id)
                .then(guild => {
                    guild.channels.create('🚀᲼find-squad',{
                        type: 'GUILD_TEXT',
                    }).then(async find_squads => {
                        const find_squads_wh = await find_squads.createWebhook('Squad',{avatar: 'https://media.discordapp.net/attachments/864199722676125757/1050526257630171227/pngwing.com.png?width=528&height=521'}).catch(console.error)
                        db.query(`
                            INSERT INTO as_sb_channels (channel_id,webhook_url,guild_id,type) VALUES ('${find_squads.id}','${find_squads_wh.url}','${guild_id}','find_squads');
                        `).then(async () => {
                            for (const [index,val] of ['1','2','3','4','5','6'].entries()) {
                                var msg_type;
                                if (index == 0) msg_type = 'recruitment_intro'
                                if (index == 1) msg_type = 'find_squads_1'
                                if (index == 2) msg_type = 'find_squads_2'
                                if (index == 3) msg_type = 'find_squads_3'
                                if (index == 4) msg_type = 'find_squads_4'
                                if (index == 5) msg_type = 'find_squads_5'
                                await find_squads_wh.send('_ _').then(msg => {
                                    db.query(`INSERT INTO as_sb_messages (message_id, channel_id, type) VALUES ('${msg.id}', '${find_squads.id}', '${msg_type}')`)
                                }).catch(console.error)
                            }
                            setTimeout(assign_global_variables, 10000);
                            setTimeout(edit_recruitment_intro, 15000);
                            resolve({id: find_squads.id})
                        }).catch(err => reject(err))
                    }).catch(err => reject(err))
                }).catch(err => reject(err))
            } else reject('Unexpected result querying db, please contact developer')
        }).catch(err => {
            console.log(err)
            if (err.code == '23505') return reject('Server is already affiliated')
            reject(err)
        })
    })
}

function remove_server(guild_id) {
    return new Promise((resolve,reject) => {
        db.query(`
            SELECT * FROM as_sb_channels where guild_id='${guild_id}';
            DELETE FROM as_sb_guilds where guild_id='${guild_id}';
        `).then(res => {
            if (res[1].rowCount == 1) {
                res[0].rows.forEach(async row => {
                    const channel = client.channels.cache.get(row.channel_id) || await client.channels.fetch(row.channel_id).catch(console.error)
                    if (!channel) return
                    channel.send('This server has been unaffiliated from AllSquads. Farewell!').catch(console.error)
                })
                resolve()
            } else return reject('Server is not affiliated')
        }).catch(err => reject(err))
    })
}

function embed(squads, with_all_names, name_for_squad_id) {
    //var fields = []
    var components = []

    const new_squads_obj = {}
    default_squads.concat(squads).map(squad => {
        new_squads_obj[squad.squad_string] = squad
    })

    const new_squads = []
    Object.keys(new_squads_obj).map(squad => {
        new_squads.push(new_squads_obj[squad])
    })

    console.log(JSON.stringify(new_squads))

    new_squads.map((squad,index) => {
        // var field_value = '\u200b'
        // if (with_all_names || (name_for_squad_id && squad.squad_id == name_for_squad_id)) 
        //     field_value = squad.members.map(id => users_list[id]?.ingame_name).join('\n')
        // else {
        //     if (squad.members.length > 2) field_value += ' ' + emote_ids.hot
        //     if (squad.is_steelpath) field_value += ' ' + emote_ids.steel_essence
        //     if (squad.is_railjack) field_value += ' ' + emote_ids.railjack
        //     if (squad.is_old) field_value += ' ' + emote_ids.cold
        // }
        // fields.push({
        //     name: `${squad.main_relics.join(' ').toUpperCase()} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ').toUpperCase()} ${squad.off_refinements.join(' ')} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim(),
        //     value: field_value,
        //     inline: true
        // })
        const k = Math.ceil((index + 1)/3) - 1
        if (!components[k]) components[k] = {type: 1, components: []}
        components[k].components.push({
            type: 2,
            label: `${squad.members.length}/${squad.spots} ${convertUpper(squad.squad_string)}`,
            style: squad.members.length == 4 ? 2:squad.members.length == 3 ? 4:squad.members.length == 2 ? 3:squad.members.length == 1 ? 1:2,
            custom_id: squad.is_default ?  `as_sb_sq_default_${squad.squad_string}`: `as_sb_sq_${squad.squad_id}`
        })
    })
    const msg = {
        content: '\u200b',
        embeds: [],
        components: components
    }
    return msg
}

function edit_recruitment_intro() {
    webhook_messages.recruitment_intro?.forEach(msg => {
        new WebhookClient({url: msg.url}).editMessage(msg.m_id, {
            content: ' ',
            embeds: [{
                title: 'Recruitment',
                description: '- Click on the button to join a squad. Click again to leave; or click Leave All\n\n- If you have an open squad, **always be ready to play under 2-5 minutes!**\n\n- You will be notified in DMs when squad fills. Unfilled squads **expire** in 1 hour\n\n- Ask anything in <#914990518558134292>. For any queries or bugs, use <#1003269491163148318>\n\n- The server just opened, give it some time to reach full activity! 🙂',
                color: '#ffffff',
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Host Squad",
                    style: 3,
                    custom_id: `sb_sq_create_modal`
                },{
                    type: 2,
                    label: "Leave all",
                    style: 4,
                    custom_id: `sb_sq_leave_all`
                },{
                    type: 2,
                    label: "Squad Info",
                    style: 1,
                    custom_id: `sb_sq_squad_info`
                }]
            }, {
                type: 1,
                components: [{
                    type: 3,
                    custom_id: "sb_sq_tracker",
                    options:[
                        {
                            "label": "Rogue",
                            "value": "rogue",
                            "description": "Sneak n stab",
                            "emoji": {
                                "name": "rogue",
                                "id": "625891304148303894"
                            }
                        },
                        {
                            "label": "Mage",
                            "value": "mage",
                            "description": "Turn 'em into a sheep",
                            "emoji": {
                                "name": "mage",
                                "id": "625891304081063986"
                            }
                        },
                        {
                            "label": "Priest",
                            "value": "priest",
                            "description": "You get heals when I'm done doing damage",
                            "emoji": {
                                "name": "priest",
                                "id": "625891303795982337"
                            }
                        }
                    ],
                    placeholder: "Notification Settings",
                    min_values: 1,
                    max_values: 3
                }]
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
                    custom_id: `as_sb_merge_false$${response.squad_code}`
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


var subscribersTimeout = {}
socket.on('squadbot/squadCreate', (squad) => {
    console.log('[squadbot/squadCreate]',squad)
    const tier = squad.tier
    socket.emit('squadbot/squads/fetch',{},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(res.data, false, squad.squad_id)
        }
    })
    // socket.emit('squadbot/trackers/fetchSubscribers',{squad: squad},(res) => {
    //     if (res.code == 200) {
    //         const channel_ids = res.data
    //         for (const channel_id in channel_ids) {
    //             const discord_ids = channel_ids[channel_id].filter(sub => !subscribersTimeout[sub])
    //             discord_ids.map(sub => {
    //                 subscribersTimeout[sub] = true
    //                 setTimeout(() => {
    //                     delete subscribersTimeout[sub]
    //                 }, 120000);
    //             })
    //             if (discord_ids.length > 0) {
    //                 new WebhookClient({url: webhooks_list[channel_id]}).send({
    //                     content: `${relicBotSquadToString(squad)} ${discord_ids.map(id => `<@${id}>`).join(', ')}`
    //                 }).then(res => {
    //                     setTimeout(() => {
    //                         new WebhookClient({url: webhooks_list[channel_id]}).deleteMessage(res.id).catch(console.error)
    //                     }, 10000);
    //                 }).catch(console.error)
    //             }
    //         }
    //     }
    // })
})

socket.on('squadbot/squadUpdate', (payload) => {
    console.log('[squadUpdate]',payload)
    const squad = payload[0]
    socket.emit('squadbot/squads/fetch',{tier: squad.tier},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(res.data, squad.tier, false,squad.squad_id)
        }
    })
})

socket.on('squadbot/squads/opened', async (payload) => {
    event_emitter.emit('relicbot_squad_filled',payload)
    console.log('[relicbot/squads/opened]',payload)
    const squad = payload
    const thread_ids = []
    const channel_ids = {}
    for (const discord_id in squad.joined_from_channel_ids) {
        const channel_id = squad.joined_from_channel_ids[discord_id]
        if (!channel_ids[channel_id]) channel_ids[channel_id] = []
        channel_ids[channel_id].push(discord_id)
    }
    console.log('channel_ids:',channel_ids)
    //send dms
    for (const channel_id in channel_ids) {
        const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
        if (!channel) continue
        await channel.threads.create({
            name: `${convertUpper(squad.tier)} ${squad.main_relics.join(' ')}`,
            autoArchiveDuration: 60,
            reason: 'Relic squad filled'
        }).then(async thread => {
            channel_ids[channel_id].map(async discord_id => {
                const user = client.users.cache.get(discord_id) || client.users.fetch(discord_id).catch(console.error)
                if (user)
                    user.send(`Your **${relicBotSquadToString(squad)}** squad has been filled. Click <#${thread.id}> to view squad`).catch(console.error)
            })
            thread_ids.push(thread.id)
            thread.send({
                content: `Squad filled ${channel_ids[channel_id].map(m => `<@${m}>`).join(', ')}`,
                embeds: [{
                    description: `**${relicBotSquadToString(squad)}**\n\n/invite ${squad.members.map(id => users_list[id]?.ingame_name).join('\n/invite ').replace(/_/g, '\_')}`
                }]
            }).catch(console.error)
            if (Object.keys(channel_ids).length > 1) thread.send({content: 'This is a cross-server communication. Messages sent here will also be sent to respective members'}).catch(console.error)
            setTimeout(() => channel.messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        }).catch(console.error)
    }
    socket.emit('relicbot/squads/update',{params: `thread_ids='${JSON.stringify(thread_ids)}' WHERE squad_id='${squad.squad_id}' AND status='opened'`})
})

socket.on('squadbot/squads/closed', async (payload) => {
    payload.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({content: `**--- Squad closed ---**`}).catch(console.error)
        channel.setArchived().catch(console.error)
    })
})

socket.on('squadbot/squads/disbanded', async (payload) => {
    payload.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({content: `**--- Squad disbanded. A member joined another squad ---**`}).catch(console.error)
        channel.setArchived().catch(console.error)
    })
})

socket.on('tradebotUsersUpdated', (payload) => {
    console.log('[relicbot] tradebotUsersUpdated')
    update_users_list()
})

socket.on('squadMessageCreate',payload => {
    payload.squad_thread_ids.forEach(async thread_id => {
        if (thread_id != payload.thread_id) {
            const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
            if (!channel) return
            channel.send({content: `**${users_list[payload.discord_id]?.ingame_name}**: ${payload.message}`})
        }
    })
})

module.exports = {
    channels_list
}