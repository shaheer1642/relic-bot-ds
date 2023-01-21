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
const {translatePayload} = require('./allsquads')
const {emote_ids, emoteObjFromSquadString} = require('./emotes')
const {as_users_ratings} = require('./allsquads/as_users_ratings')

const server_commands_perms = [
    '253525146923433984', //softy
    '253980061969940481', //leo
    '353154275745988610', //john 
    '385459793508302851' //ady 
]

const webhook_messages = {}
const channels_list = {}
const webhooks_list = {}

client.on('channelDelete', channel => {
    db.query(`DELETE FROM as_sb_trackers WHERE channel_id = '${channel.id}'; DELETE FROM rb_trackers WHERE channel_id = '${channel.id}';`).catch(console.error)
})

const default_squads = [{
    squad_string: 'aya_farm',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'sortie',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'steelpath_incursion',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'alert',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'eidolon',
    spots: 4,
    members: [],
    is_default: true
},{
    squad_string: 'need_help',
    spots: 2,
    members: [],
    is_default: true
},{
    squad_string: 'index',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'profit_taker',
    spots: 4,
    members: [],
    is_default: true
},{
    squad_string: 'leveling',
    spots: 4,
    members: [],
    is_default: true
},{
    squad_string: 'arbitration',
    spots: 4,
    members: [],
    is_default: true
},{
    squad_string: 'nightwave',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'lich_(murmur)',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'sister_(murmur)',
    spots: 3,
    members: [],
    is_default: true
},{
    squad_string: 'endo_arena',
    spots: 4,
    members: [],
    is_default: true
},{
    squad_string: 'archon_hunt',
    spots: 4,
    members: [],
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
                message: `${message.content}\n${message.attachments.map(attachment => attachment.url).join('\n')}`.trim(),
                thread_id: message.channel.id
            }, res => console.log(res))
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
        if (!Object.keys(channels_list).includes(interaction.channel.id) && interaction.guild) return

        if (interaction.customId == 'as_sb_sq_leave_all') {
            socket.emit('squadbot/squads/leaveall',{discord_id: interaction.user.id},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId == 'as_sb_sq_trackers_add_modal') {
            interaction.showModal({
                title: "Track Squads",
                custom_id: "as_sb_sq_trackers_add",
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "squad_name",
                            label: "Squad Name(s) seperated by new line",
                            style: 2,
                            min_length: 1,
                            max_length: 4000,
                            placeholder: "hydron\nprofit taker\neidolon 5x3",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        } else if (interaction.customId == 'as_sb_sq_trackers_show') {
            socket.emit('squadbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                if (res.code == 200) {
                    interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                } else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId == 'as_sb_sq_trackers_remove_all') {
            socket.emit('squadbot/trackers/delete',{discord_id: interaction.user.id},(res) => {
                socket.emit('squadbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                    if (res.code == 200) {
                        interaction.update(constructTrackersEmbed(res.data,true)).catch(console.error)
                    } else {
                        interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                    }
                })
            })
        } else if (interaction.customId == 'as_sb_sq_create_modal') {
            interaction.showModal({
                title: "Host Squad",
                custom_id: "as_sb_sq_create",
                components: [
                    {
                        type: 1,
                        components: [{
                            type: 4,
                            custom_id: "squad_name",
                            label: "Squad Name(s) seperated by new line",
                            style: 2,
                            min_length: 1,
                            max_length: 4000,
                            placeholder: "hydron\nprofit taker\neidolon 5x3",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        } else if (interaction.customId == 'as_sb_sq_squad_info') {
            edit_webhook_messages(true, null, interaction.channel.id)
            interaction.deferUpdate().catch(console.error)
        } else if (interaction.customId.match('as_sb_sq_merge_false')) {
            socket.emit('squadbot/squads/create',{message: interaction.customId.split('$')[1].replace(/_/g,' '), discord_id: interaction.user.id, channel_id: interaction.channel.id, merge_squad: false}, responses => {
                interaction.deferUpdate().catch(console.error)
                interaction.message.delete().catch(console.error)
                handleSquadCreateResponses(interaction.channel.id,interaction.user.id,responses)
            })
        } else if (interaction.customId.match('as_sb_sq_merge_true_')) {
            const squad_id = interaction.customId.split('as_sb_sq_merge_true_')[1]
            const discord_id = interaction.user.id
            socket.emit('squadbot/squads/addmember',{squad_id: squad_id,discord_id: discord_id,channel_id: interaction.channel.id},(res) => {
                if (res.code == 200) {
                    interaction.deferUpdate().catch(console.error)
                    interaction.message.delete().catch(console.error)
                }
                else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        } else if (interaction.customId.match('as_sb_sq_default_')) {
            socket.emit('squadbot/squads/create',{message: interaction.customId.split('as_sb_sq_default_')[1].replace(/_/g,' '), discord_id: interaction.user.id, channel_id: interaction.channel.id}, responses => {
                interaction.deferUpdate().catch(console.error)
                handleSquadCreateResponses(interaction.channel.id,interaction.user.id,responses)
            })
        } else if (interaction.customId.match('as_sb_sq_')) {
            const squad_id = interaction.customId.split('as_sb_sq_')[1]
            const discord_id = interaction.user.id
            socket.emit('squadbot/squads/addmember',{squad_id: squad_id,discord_id: discord_id,channel_id: interaction.channel.id},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
    }
    if (interaction.isModalSubmit()) {
        if (!Object.keys(channels_list).includes(interaction.channel.id) && interaction.guild) return
        if (interaction.customId == 'as_sb_sq_trackers_add') {
            console.log('[as_sb_sq_trackers_add]')
            socket.emit('squadbot/trackers/create',{message: interaction.fields.getTextInputValue('squad_name'),discord_id: interaction.user.id,channel_id: Object.keys(channels_list).includes(interaction.channel.id) ? interaction.channel.id : '1054843353302323281'},(responses) => {
                // console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                socket.emit('squadbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                    if (res.code == 200) {
                        if (interaction.message) {
                            if (interaction.message.embeds[0]) {
                                if (interaction.message.embeds[0].title == 'Tracked Squads') {
                                    interaction.update(constructTrackersEmbed(res.data,true)).catch(console.error)
                                } else {
                                    interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                                }
                            } else {
                                interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                            }
                        } else {
                            interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                        }
                    } else {
                        interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                    }
                })
            })
        } else if (interaction.customId == 'as_sb_sq_create') {
            //console.log('[relicbot rb_sq_create] content:',message.content)
            
            socket.emit('squadbot/squads/create',{message: interaction.fields.getTextInputValue('squad_name'), discord_id: interaction.user.id, channel_id: interaction.channel.id},responses => {
                interaction.deferUpdate().catch(console.error)
                handleSquadCreateResponses(interaction.channel.id,interaction.user.id,responses)
            })
        }
    }
    if (interaction.isSelectMenu()) {
        if (!Object.keys(channels_list).includes(interaction.channel.id) && interaction.guild) return
        if (interaction.customId == 'as_sb_sq_trackers_add_menu') {
            console.log('[as_sb_sq_trackers_add_menu]')
            socket.emit('squadbot/trackers/create',{message: interaction.values,discord_id: interaction.user.id, channel_id: Object.keys(channels_list).includes(interaction.channel.id) ? interaction.channel.id : '1054843353302323281'},(responses) => {
                //console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                socket.emit('squadbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                    if (res.code == 200) {
                        edit_recruitment_intro()
                        if (interaction.message) {
                            if (interaction.message.embeds[0]) {
                                if (interaction.message.embeds[0].title == 'Tracked Squads') {
                                    interaction.update(constructTrackersEmbed(res.data,true)).catch(console.error)
                                } else {
                                    interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                                }
                            } else {
                                interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                            }
                        } else {
                            interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                        }
                    } else {
                        interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                    }
                })
            })
        } else if (interaction.customId == 'as_sb_sq_trackers_remove') {
            socket.emit('squadbot/trackers/delete',{tracker_ids: interaction.values},(res) => {
                socket.emit('squadbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                    if (res.code == 200) {
                        interaction.update(constructTrackersEmbed(res.data,true)).catch(console.error)
                    } else {
                        interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                    }
                })
            })
        } 
    }
})

function constructTrackersEmbed(trackers, ephemeral) {

    const component_options = trackers.reduce((arr,tracker,index) => {
        if (index < 25) {
            arr.push({
                label: `${convertUpper(tracker.squad_string)}`,
                value: tracker.tracker_id,
                emoji: emoteObjFromSquadString(tracker.squad_string)
            })
        }
        return arr
    },[])

    var payload = {
        content: ' ',
        embeds: [{
            title: 'Tracked Squads',
            description: trackers.length == 0 ? 'You are not tracking any squads':'',
            color: 'WHITE',
            fields: trackers.length == 0 ? []:[{
                name: 'Squad Name',
                value: trackers.map(tracker => `${convertUpper(tracker.squad_string)}`).join('\n'),
                inline: true
            }]
        }],
        components: component_options.length > 0 ? [{
            type: 1,
            components: [{
                    type: 3,
                    custom_id: "as_sb_sq_trackers_remove",
                    options: component_options,
                    placeholder: "Choose a tracker to remove",
                    min_values: 1,
                    max_values: component_options.length
            }]
        },{
            type: 1,
            components: [{
                    type: 2,
                    label: "Add Tracker",
                    style: 3,
                    custom_id: "as_sb_sq_trackers_add_modal"
                },{
                    type: 2,
                    label: "Remove All",
                    style: 4,
                    custom_id: "as_sb_sq_trackers_remove_all"
            }]
        }] : [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Add Tracker",
                    style: 3,
                    custom_id: "as_sb_sq_trackers_add_modal"
                }
            ]
        }],
        ephemeral: ephemeral
    }
    return payload
}

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
            webhook_client.send(payload).then(res => setTimeout(() => webhook_client.deleteMessage(res.id).catch(console.error), timeout)).catch(console.error)
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
                            setTimeout(edit_webhook_messages, 15000);
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

var timeout_edit_webhook_messages = null
var timeout_edit_webhook_messages_reset = null
var edit_webhook_messages_time_since_last_call = 0
function edit_webhook_messages(with_all_names,name_for_squad_id, single_channel_id) {
    clearTimeout(timeout_edit_webhook_messages)
    timeout_edit_webhook_messages = setTimeout(() => {
        socket.emit('squadbot/squads/fetch',{},(res) => {
            if (res.code == 200) {
                const squads = res.data
                const payloads = embed(squads,with_all_names,name_for_squad_id)
                Array(5).fill(0).forEach((value,index) => {
                    webhook_messages[`find_squads_${index+1}`].forEach(async msg => {
                        if (!single_channel_id || single_channel_id == msg.c_id) {
                            if (payloads[index]) {
                                new WebhookClient({url: msg.url}).editMessage(msg.m_id, payloads[index]).catch(console.error)
                            } else if (!payloads[index]) {
                                const channel = client.channels.cache.get(msg.c_id) || await client.channels.fetch(msg.c_id).catch(console.error)
                                if (!channel) return
                                const message = channel.messages.cache.get(msg.m_id) || await channel.messages.fetch(msg.m_id).catch(console.error)
                                if (!message) return
                                if (message.components.length != 0) {
                                    new WebhookClient({url: msg.url}).editMessage(msg.m_id, {content: '_ _', embeds: [], components: []}).catch(console.error)
                                }
                            }
                        }
                    })
                })
            }
        })
    }, new Date().getTime() - edit_webhook_messages_time_since_last_call > 1000 ? 0 : 500)
    if (!single_channel_id) clearTimeout(timeout_edit_webhook_messages_reset)
    timeout_edit_webhook_messages_reset = setTimeout(() => {
        socket.emit('squadbot/squads/fetch',{},(res) => {
            if (res.code == 200) {
                const squads = res.data
                const payloads = embed(squads)
                Array(5).fill(0).forEach((value,index) => {
                    webhook_messages[`find_squads_${index+1}`].forEach(async msg => {
                        if (!single_channel_id || single_channel_id == msg.c_id) {
                            if (payloads[index]) {
                                new WebhookClient({url: msg.url}).editMessage(msg.m_id, payloads[index]).catch(console.error)
                            } else if (!payloads[index]) {
                                const channel = client.channels.cache.get(msg.c_id) || await client.channels.fetch(msg.c_id).catch(console.error)
                                if (!channel) return
                                const message = channel.messages.cache.get(msg.m_id) || await channel.messages.fetch(msg.m_id).catch(console.error)
                                if (!message) return
                                if (message.components.length != 0) {
                                    new WebhookClient({url: msg.url}).editMessage(msg.m_id, {content: '_ _', embeds: [], components: []}).catch(console.error)
                                }
                            }
                        }
                    })
                })
            }
        })
    }, 6000);
    edit_webhook_messages_time_since_last_call = new Date().getTime()
}

function embed(squads, with_all_names, name_for_squad_id) {
    // console.log('embed called',new Date().getTime())

    const new_squads_obj = {}
    default_squads.concat(squads).map((squad,index) => {
        if (new_squads_obj[squad.squad_string] && !new_squads_obj[squad.squad_string].is_default)
            new_squads_obj[squad.squad_string + index] = squad
        else
            new_squads_obj[squad.squad_string] = squad
    })

    const new_squads = []
    Object.keys(new_squads_obj).map(squad => {
        new_squads.push(new_squads_obj[squad])
    })

    //console.log(JSON.stringify(new_squads),new Date().getTime()) 

    const payloads = []
    new_squads.map((squad,index) => {
        const payload_index = Math.ceil((index + 1)/15) - 1
        const component_index = Math.ceil((index - payload_index * 15 + 1)/3) - 1
        if (!payloads[payload_index]) payloads[payload_index] = {content: ' ', embeds: [{description: '⸻'.repeat(13), fields: []}], components: []}
        if (with_all_names || (name_for_squad_id && squad.squad_id == name_for_squad_id)) {
            if (squad.members.length > 0) {
                payloads[payload_index].embeds[0].fields.push({
                    name: convertUpper(squad.squad_string),
                    value: squad.members.map(id => `${users_list[id]?.ingame_name} ${as_users_ratings[id]?.highly_rated ? '★':''}`.trim()).join('\n'),
                    inline: true
                })
            }
        }
        if (!payloads[payload_index].components[component_index]) payloads[payload_index].components[component_index] = {type: 1, components: []}
        payloads[payload_index].components[component_index].components.push({
            type: 2,
            label: `${squad.members.length}/${squad.spots} ${convertUpper(squad.squad_string)}`,
            style: squad.members.length == 0 ? 2 : (squad.spots - squad.members.length) == 1 ? 4 : (squad.spots - squad.members.length) == 2 ? 3 : (squad.spots - squad.members.length) == 3 ? 1 : 2,
            custom_id: squad.is_default ?  `as_sb_sq_default_${squad.squad_string}_1/${squad.spots}`: `as_sb_sq_${squad.squad_id}`,
            emoji: emoteObjFromSquadString(squad.squad_string)
        })
    })
    //console.log(JSON.stringify(payloads))
    return payloads
}

function edit_recruitment_intro() {
    webhook_messages.recruitment_intro?.forEach(msg => {
        new WebhookClient({url: msg.url}).editMessage(msg.m_id, translatePayload({
            content: ' ',
            embeds: [{
                title: 'Recruitment',
                description: `- Click on the button to join a squad. Click again to leave; or click 'Leave All'\n\n- If you have an open squad, **always be ready to play under 2-5 minutes!**\n\n- You will be notified in DMs when squad fills. Unfilled squads expire in 1 hour${msg.c_id == '1054843353302323281' ? `\n\n- Ask anything in <#914990518558134292>. For any queries or bugs, use <#1003269491163148318>\n\n- The server just opened, give it some time to reach full activity! 🙂`:''}${msg.c_id == '1054843353302323281' ? '':'\n\n[This bot is created by Warframe Squads](https://discord.gg/346ZthxCe8)'}`,
                color: '#ffffff',
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Host Squad",
                    style: 3,
                    custom_id: `as_sb_sq_create_modal`
                },{
                    type: 2,
                    label: "Leave all",
                    style: 4,
                    custom_id: `as_sb_sq_leave_all`
                },{
                    type: 2,
                    label: "Squad Info",
                    style: 1,
                    custom_id: `as_sb_sq_squad_info`
                },{
                    type: 2,
                    label: "Tracked Squads",
                    style: 2,
                    custom_id: `as_sb_sq_trackers_show`
                }]
            },{
                type: 1,
                components: [{
                    type: 3,
                    custom_id: "as_sb_sq_trackers_add_menu",
                    options: default_squads.map((squad) => ({
                        label: convertUpper(squad.squad_string),
                        value: squad.squad_string,
                        emoji: emoteObjFromSquadString(squad.squad_string)
                    })),
                    placeholder: "Notification Settings",
                    min_values: 1,
                    max_values: default_squads.length
                }]
            }]
        }, channels_list[msg.c_id].lang)).catch(console.error)
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


var subscribersTimeout = {}
socket.on('squadbot/squadCreate', (squad) => {
    if (squad.status != 'active') return
    console.log('[squadbot/squadCreate]')
    socket.emit('squadbot/squads/fetch',{},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(false, squad.squad_id)
        }
    })
    socket.emit('squadbot/trackers/fetchSubscribers',{squad: squad},(res) => {
        if (res.code == 200) {
            const channel_ids = res.data
            for (const channel_id in channel_ids) {
                const discord_ids = channel_ids[channel_id].filter(sub => !subscribersTimeout[sub])
                discord_ids.map(sub => {
                    subscribersTimeout[sub] = true
                    setTimeout(() => {
                        delete subscribersTimeout[sub]
                    }, 120000);
                })
                if (discord_ids.length > 0) {
                    new WebhookClient({url: webhooks_list[channel_id]}).send({
                        content: `Someone is looking for ${convertUpper(squad.squad_string)} squad ${discord_ids.map(id => `<@${id}>`).join(', ')}`
                    }).then(res => {
                        setTimeout(() => {
                            new WebhookClient({url: webhooks_list[channel_id]}).deleteMessage(res.id).catch(console.error)
                        }, 10000);
                    }).catch(console.error)
                }
            }
        }
    })
})

socket.on('squadbot/squadUpdate', (payload) => {
    console.log('[squadUpdate]')
    const squad = payload[0]
    edit_webhook_messages(false, squad.squad_id)
})

const squadOpenMessages = {}
socket.on('squadbot/squads/opened', async (payload) => {
    // event_emitter.emit('squadbot_squad_filled',payload)
    console.log('[squadbot/squads/opened]')
    const squad = payload
    const thread_ids = []
    const channel_ids = {}
    for (const discord_id of squad.members) {
        const channel_id = squad.joined_from_channel_ids[discord_id] || '1054843353302323281'
        if (!channel_ids[channel_id]) channel_ids[channel_id] = []
        channel_ids[channel_id].push(discord_id)
    }
    //console.log('channel_ids:',channel_ids)
    //send dms
    for (const channel_id in channel_ids) {
        const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
        if (!channel) continue
        await channel.threads.create({
            name: `${convertUpper(squad.squad_string)}`,
            autoArchiveDuration: 60,
            reason: 'Squad filled',
            type: 'private'
        }).then(async thread => {
            channel_ids[channel_id].map(async discord_id => {
                try {
                    const user = client.users.cache.get(discord_id) || client.users.fetch(discord_id).catch(console.error)
                    user.send(`Your **${convertUpper(squad.squad_string)}** squad has been filled. Click <#${thread.id}> to view squad`).catch(console.error)
                } catch(e) {
                    console.log(e)
                }
            })
            thread_ids.push(thread.id)
            thread.send({
                content: `Squad filled ${channel_ids[channel_id].map(m => `<@${m}>`).join(', ')}`,
                embeds: [{
                    title: convertUpper(squad.squad_string),
                    description: `Please decide a host and invite each other in the game\n\n/invite ${squad.members.map(id => enquote(users_list[id]?.ingame_name)).sort().join('\n/invite ').replace(/_/g, '\\_')}`,
                    footer: {
                        text: `This squad will auto-close in ${Math.round(squad.squad_closure / 60 / 1000)}m`
                    }
                }],
                components: [{
                    type: 1,
                    components: [
                        squad.squad_string == 'aya_farm' ? {
                            type: 2,
                            label: `Best ways to farm Aya`,
                            style: 3,
                            custom_id: '47462eb6-982e-11ed-9ae6-0242ac1100a8',
                        } : null,
                        {
                        type: 2,
                        label: `Become Host`,
                        style: 1,
                        custom_id: `as_sq_become_host.squadbot.${squad.squad_id}`,
                    }].filter(o => o !== null)
                }]
            }).then(msg => {
                squadOpenMessages[`${squad.squad_id}_${thread.id}`] = msg
            }).catch(console.error)
            if (Object.keys(channel_ids).length > 1) thread.send({content: 'This is a cross-server communication. Messages sent here will also be sent to respective members'}).catch(console.error)
            setTimeout(() => channel.messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        }).catch(console.error)
    }
    socket.emit('squadbot/squads/update',{params: `thread_ids='${JSON.stringify(thread_ids)}' WHERE squad_id='${squad.squad_id}' AND status='opened'`})
    logSquad(payload, false, 'squad_opened')
})

function enquote(username) {
    return username.match(' ') ? `"${username}"`:username
}

socket.on('squadbot/squads/closed', async (squad) => {
    squad.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({
            content: `**⸻ Squad closed ⸻**`,
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Rate Squad",
                    emoji: "⭐",
                    style: 2,
                    custom_id: `as_users_rate.${squad.members.join('_')}`
                },{
                    type: 2,
                    label: "Rate Host Connection",
                    emoji: "⚡",
                    style: 2,
                    custom_id: `as_host_rate.${squad.members.join('_')}`,
                    disabled: squad.members.includes('892087497998348349') ? false : true
                },]
            }]
        })
        .then(res => {
            // channel.setArchived().catch(console.error)
        }).catch(console.error)
    })
    logSquad(squad, true, 'squad_closed')
})

socket.on('squadbot/squads/disbanded', async (squad) => {
    squad.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({content: `**⸻ Squad disbanded. A member joined another squad ⸻**`})
        .then(res => {
            channel.setArchived().catch(console.error)
        }).catch(console.error)
    })
    logSquad(squad, true, 'squad_disbanded')
})

socket.on('squadbot/squads/selectedhost', async (payload) => {
    payload.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send(`**${users_list[payload.squad_host].ingame_name}** is hosting this squad\n- Please invite everyone, and make sure the squad is set to "invite-only"\n- Only the host should initiate the mission\n- If host migrates, same rules apply`).catch(console.error)
        const openMessage = squadOpenMessages[`${payload.squad_id}_${thread_id}`] 
        if (openMessage) {
            openMessage.edit({
                components: openMessage.components.map(component => ({type: 1, components: component.components.map(subcomponent => subcomponent.customId.split('.')[0] == 'as_sq_become_host' ?  {...subcomponent, disabled: true, label: `Become Host (${users_list[payload.squad_host].ingame_name} is Hosting)`} : subcomponent)}))
            }).catch(console.error)
        }
    })
})

async function logSquad(squad,include_chat,action) {
    const channel = client.channels.cache.get('1059876227504152666') || await client.channels.fetch('1059876227504152666').catch(console.error)
    if (!channel) return
    const squadFillTime = `**Squad Fill Time:** ${msToFullTime(Number(squad.open_timestamp) - Number(squad.creation_timestamp))}`
    const squadMembers = `**⸻ Squad Members ⸻**\n${squad.members.map(id => users_list[id]?.ingame_name).join('\n')}`
    const squadLogs = `**⸻ Squad Logs ⸻**\n${squad.logs.map(log => `${log.replace(log.split(' ')[0],`[<t:${Math.round(Number(log.split(' ')[0])/1000)}:t>]`).replace(log.split(' ')[1],`**${users_list[log.split(' ')[1]]?.ingame_name}**`)}`).join('\n')}`
    if (include_chat) {
        socket.emit('squadbot/squads/messagesFetch', {squad_id: squad.squad_id}, async (res) => {
            if (res.code == 200) {
                const chats = res.data
                const squadChat = `**⸻ Squad Chat ⸻**\n${chats.map(chat => `[<t:${Math.round(Number(chat.creation_timestamp) / 1000)}:t>] **${users_list[chat.discord_id]?.ingame_name}:** ${chat.message}`).join('\n')}`
                channel.send({
                    content: convertUpper(action),
                    embeds: [{
                        title: convertUpper(squad.squad_string),
                        description: `${squadFillTime}\n\n${squadMembers}\n\n${squadLogs}\n\n${squadChat}`.trim().replace(/_/g, '\\_'),
                        timestamp: new Date(),
                        footer: {
                            text: `Squad Id: ${squad.squad_id}\n\u200b`
                        },
                        color: action == 'squad_opened' ? 'GREEN' : action == 'squad_closed' ? 'BLUE' : action == 'squad_disbanded' ? 'PURPLE' : 'WHITE'
                    }],
                    components: action == 'squad_closed' ? [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: "Validate",
                            emoji: "✅",
                            style: 2,
                            custom_id: `as_sq_validate.squadbot.${squad.squad_id}`
                        },{
                            type: 2,
                            label: "Invalidate",
                            emoji: "🛑",
                            style: 2,
                            custom_id: `as_sq_invalidate.squadbot.${squad.squad_id}`
                        }]
                    }]:[]
                }).catch(console.error)
            }
        })
    } else {
        channel.send({
            content: convertUpper(action),
            embeds: [{
                title: convertUpper(squad.squad_string),
                description: `${squadFillTime}\n\n${squadMembers}\n\n${squadLogs}`.trim().replace(/_/g, '\\_'),
                timestamp: new Date(),
                footer: {
                    text: `Squad Id: ${squad.squad_id}\n\u200b`
                },
                color: action == 'squad_opened' ? 'GREEN' : action == 'squad_closed' ? 'BLUE' : action == 'squad_disbanded' ? 'PURPLE' : 'WHITE'
            }],
            components: action == 'squad_closed' ? [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Validate",
                    emoji: "✅",
                    style: 2,
                    custom_id: `as_sq_validate.squadbot.${squad.squad_id}`
                },{
                    type: 2,
                    label: "Invalidate",
                    emoji: "🛑",
                    style: 2,
                    custom_id: `as_sq_invalidate.squadbot.${squad.squad_id}`
                }]
            }]:[]
        }).catch(console.error)
    }
}

socket.on('tradebotUsersUpdated', (payload) => {
    console.log('[relicbot] tradebotUsersUpdated')
    update_users_list()
})

socket.on('squadbot/squadMessageCreate',payload => {
    payload.squad_thread_ids.forEach(async thread_id => {
        if (thread_id != payload.thread_id) {
            const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
            if (!channel) return
            channel.send({content: `**${users_list[payload.discord_id]?.ingame_name}**: ${payload.message}`})
        }
    })
})

module.exports = {
    channels_list,
    default_squads,
    emoteObjFromSquadString
}