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
    lith: '<:Lith:1060995797807804496>',
    meso: '<:Meso:1060997039808336002>',
    neo: '<:Neo:1060997042702401646>',
    axi: '<:Axi:1060997035815358634>',
}

client.on('ready', async () => {
    assign_global_variables().then(() => {
        edit_recruitment_intro()
        fissures_check()
    }).catch(console.error)
    update_users_list()
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
            webhook_client.send(payload).then(res => setTimeout(() => webhook_client.deleteMessage(res.id).catch(console.error), timeout)).catch(console.error)
        }
    })
}

function replyAndDelete(payload,messageObj,timeout) {
    try {
        messageObj.channel.send(typeof payload == "object" ? payload : {
            content: ' ',
            embeds: [{
                description: payload
            }]
        }).then(res => {
            setTimeout(() => {
                res.delete().catch(console.error)
            }, timeout || 5000);
        }).catch(console.error)
    } catch(e) {
        console.error(e)
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (message.channel.isText() && Object.keys(channels_list).includes(message.channel.id) && ['relics_vaulted','relics_non_vaulted'].includes(channels_list[message.channel.id].type)) {
        if (server_commands_perms.includes(message.author.id) && message.content.toLowerCase().match(/^persist/)) return
        console.log('[relicbot messageCreate] content:',message.content)
        message.content = message.content.toLowerCase().trim()
        if (message.content.split(' ')[0] == 'leave') {
            socket.emit('relicbot/squads/leave',{discord_id: message.author.id, tier: message.content.split(' ')[1] || 'all'},(res) => {
                if (res.code != 200) replyAndDelete(error_codes_embed(res, message.author.id),message)
                setTimeout(() => message.delete().catch(console.error), 1000);
            })
        } else {
            socket.emit('relicbot/squads/create',{message: message.content, discord_id: message.author.id, channel_id: message.channel.id},responses => {
                //console.log('[relicbot/squads/create] response',responses)
                handleSquadCreateResponses(message.channel.id,message.author.id,responses)
                setTimeout(() => message.delete().catch(console.error), 1000);
            })
        }
    }
    if (message.channel.isThread() && Object.keys(channels_list).includes(message.channel.parent?.id)) {
        if (message.channel.ownerId == client.user.id) {
            socket.emit('relicbot/squads/messageCreate', {
                message_id: message.id,
                discord_id: message.author.id,
                message: `${message.content}\n${message.attachments.map(attachment => attachment.url).join('\n')}`.trim(),
                thread_id: message.channel.id
            })
        }
    }
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName == 'relic_bot') {
            if (!server_commands_perms.includes(interaction.user.id))
                return interaction.reply('You do not have permission to use this command').catch(console.error)
            await interaction.deferReply().catch(console.error)
            if (interaction.options.getSubcommand() == 'add_server') {
                rb_add_server(interaction.guild.id).then(res => {
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
                rb_remove_server(interaction.guild.id).then(res => {
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
        if (!Object.keys(channels_list).includes(interaction.channel.id)) return

        if (interaction.customId == 'rb_recruitment_faq') {
            interaction.reply(translatePayload(recruitment_faq, channels_list[interaction.channel.id].lang)).catch(console.error)
        } else if (interaction.customId == 'rb_sq_leave_all') {
            socket.emit('relicbot/squads/leave',{discord_id: interaction.user.id, tier: 'all'},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId == 'rb_sq_trackers_add_modal') {
            interaction.showModal({
                title: "Track Squads",
                custom_id: "rb_sq_trackers_add",
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
                            placeholder: "neo v8\nmeso v2 2b2 int\naxi v8 2b2 rad with axi v1 flaw",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        } else if (interaction.customId == 'rb_sq_trackers_show') {
            socket.emit('relicbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                if (res.code == 200) {
                    interaction.reply(constructTrackersEmbed(res.data,true)).catch(console.error)
                } else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId == 'rb_sq_trackers_remove_all') {
            socket.emit('relicbot/trackers/delete',{discord_id: interaction.user.id},(res) => {
                socket.emit('relicbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
                    if (res.code == 200) {
                        interaction.update(constructTrackersEmbed(res.data,true)).catch(console.error)
                    } else {
                        interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                    }
                })
            })
        } else if (interaction.customId == 'rb_sq_create_modal') {
            interaction.showModal({
                title: "Host Squad",
                custom_id: "rb_sq_create",
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
                            placeholder: "neo v8\nmeso v2 2b2 int\naxi v8 2b2 rad with axi v1 flaw",
                            required: true
                        }]
                    }
                ]
            }).catch(console.error)
        } else if (interaction.customId.match('rb_sq_info_')) {
            const tier = interaction.customId.split('rb_sq_info_')[1]
            socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
                if (res.code == 200) {
                    interaction.deferUpdate().catch(console.error)
                    edit_webhook_messages(tier, true, null, interaction.channel.id)
                } else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId.match('rb_sq_merge_false')) { 
            socket.emit('relicbot/squads/create',{message: interaction.customId.split('$')[1].replace(/_/g,' '), discord_id: interaction.user.id, channel_id: interaction.channel.id, merge_squad: false}, responses => {
                interaction.deferUpdate().catch(console.error)
                interaction.message.delete().catch(console.error)
                handleSquadCreateResponses(interaction.channel.id,interaction.user.id,responses)
            })
        } else if (interaction.customId.match('rb_sq_merge_true_')) {
            const squad_id = interaction.customId.split('rb_sq_merge_true_')[1]
            const discord_id = interaction.user.id
            socket.emit('relicbot/squads/addmember',{squad_id: squad_id,discord_id: discord_id,channel_id: interaction.channel.id},(res) => {
                if (res.code == 200) {
                    interaction.deferUpdate().catch(console.error)
                    interaction.message.delete().catch(console.error)
                }
                else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        } else if (interaction.customId.match('rb_sq_')) {
            const squad_id = interaction.customId.split('rb_sq_')[1]
            const discord_id = interaction.user.id
            socket.emit('relicbot/squads/addmember',{squad_id: squad_id,discord_id: discord_id,channel_id: interaction.channel.id},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
    }
    if (interaction.isModalSubmit()) {
        if (!Object.keys(channels_list).includes(interaction.channel.id)) return
        if (interaction.customId == 'rb_sq_trackers_add') {
            console.log('[rb_sq_trackers_add]')
            socket.emit('relicbot/trackers/create',{message: interaction.fields.getTextInputValue('squad_name'),discord_id: interaction.user.id,channel_id: interaction.channel.id},(responses) => {
                //console.log(responses)
                if (!Array.isArray(responses)) responses = [responses]
                socket.emit('relicbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
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
        } else if (interaction.customId == 'rb_sq_create') {
            //console.log('[relicbot rb_sq_create] content:',message.content)
            socket.emit('relicbot/squads/create',{message: interaction.fields.getTextInputValue('squad_name'), discord_id: interaction.user.id, channel_id: interaction.channel.id},responses => {
                //console.log('[relicbot/squads/create] response',responses)
                interaction.deferUpdate().catch(console.error)
                handleSquadCreateResponses(interaction.channel.id,interaction.user.id,responses)
            })
        }
    }
    if (interaction.isSelectMenu()) {
        if (!Object.keys(channels_list).includes(interaction.channel.id)) return
        if (interaction.customId == 'rb_sq_trackers_remove') {
            socket.emit('relicbot/trackers/delete',{tracker_ids: interaction.values},(res) => {
                socket.emit('relicbot/trackers/fetch',{discord_id: interaction.user.id},(res) => {
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

var timeout_edit_webhook_messages = {
    lith: null,
    meso: null,
    neo: null,
    axi: null,
}
var timeout_edit_webhook_messages_reset = {
    lith: null,
    meso: null,
    neo: null,
    axi: null,
}

var edit_webhook_messages_time_since_last_call = 0
function edit_webhook_messages(tier,with_all_names,name_for_squad_id, single_channel_id) {
    clearTimeout(timeout_edit_webhook_messages[tier])
    timeout_edit_webhook_messages[tier] = setTimeout(() => {
        socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
            if (res.code == 200) {
                const squads = res.data
                const payload = embed(squads,tier,with_all_names,name_for_squad_id)
                webhook_messages[tier + '_squads'].forEach(msg => {
                    if (!single_channel_id || single_channel_id == msg.c_id)
                        new WebhookClient({url: msg.url}).editMessage(msg.m_id, payload).catch(console.error)
                })
            }
        })
    }, new Date().getTime() - edit_webhook_messages_time_since_last_call > 1000 ? 0 : 500)
    if (!single_channel_id) clearTimeout(timeout_edit_webhook_messages_reset[tier])
    timeout_edit_webhook_messages_reset[tier] = setTimeout(() => {
        socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
            if (res.code == 200) {
                const squads = res.data
                const payload = embed(squads,tier)
                webhook_messages[tier + '_squads'].forEach(msg => {
                    if (!single_channel_id || single_channel_id == msg.c_id)
                        new WebhookClient({url: msg.url}).editMessage(msg.m_id, payload).catch(console.error)
                })
            }
        })
    }, 6000);
    edit_webhook_messages_time_since_last_call = new Date().getTime()
}

function assign_global_variables() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM rb_messages; SELECT * FROM rb_channels;`)
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
                        url: row.webhook_url,
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

const recruitment_faq = {
    content: ' ',
    embeds: [{
        "title": "Relic Recruitment",
        "color": 5814783,
        "fields": [
          {
            "name": "Hosting Squad",
            "value": "Type message\n```diff\nlith b1\nmeso v2 4b4 int\n```",
            "inline": true
          },
          {
            "name": "Joining Squad",
            "value": "Click button to join squad\nClick again to leave",
            "inline": true
          },
          {
            "name": "Squad fill",
            "value": "A new channel will be created including all squad members and you will be notified",
            "inline": true
          },
          {
            "name": "2b2 Squads and offcycles",
            "value": "Only 2 squad members equip hosted relic at a time, other 2 equip a random relic or offcycle if given. The role is reversed every mission\n```diff\nmeso v2 2b2 int\naxi e1 2b2 rad with axi v8 offcycle\n```"
          },
          {
            "name": "Icons",
            "value": `🔥 Squad is 3/4\n${emote_ids.steel_essence} Steelpath Squad`,
            "inline": true
          },
          {
            "name": "Track Relics",
            "value": "Add relics to be notified whenever someone hosts them",
            "inline": true
          }
        ]
    }],
    ephemeral: true
}

function edit_recruitment_intro() {
    webhook_messages.recruitment_intro?.forEach(msg => {
        new WebhookClient({url: msg.url}).editMessage(msg.m_id, translatePayload({
            content: ' ',
            embeds: [{
                "title": "Relic Recruitment",
                description: msg.c_id == '1050717341123616851' ? '':'[This bot is created by Warframe Squads](https://discord.gg/346ZthxCe8)',
                "color": 5814783,
                "fields": [
                  {
                    "name": "Icons",
                    "value": `🔥 Squad is 3/4\n${emote_ids.steel_essence} Steelpath Squad`,
                    "inline": true
                  },
                  {
                    "name": "\u200b",
                    "value": "\u200b",
                    "inline": true
                  },
                  {
                    "name": "Track Relics",
                    "value": "Add relics to be notified whenever someone hosts them",
                    "inline": true
                  }
                ]
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    custom_id: 'rb_recruitment_faq',
                    label: "FAQ",
                    style: 1
                }]
            }]
        }, channels_list[msg.c_id].lang) ).catch(console.error)
    })
}

function rb_add_server(guild_id) {
    return new Promise((resolve,reject) => {
        db.query(`INSERT INTO rb_guilds (guild_id, joined_timestamp) VALUES ('${guild_id}',${new Date().getTime()})`)
        .then(res => {
            if (res.rowCount == 1) {
                client.guilds.fetch(guild_id)
                .then(guild => {
                    guild.channels.create('━━ RELICS RECRUITEMENT ━━',{
                        type: 'GUILD_CATEGORY',
                    }).then(category => { 
                        guild.channels.create('•🔮•relic-squads',{
                            type: 'GUILD_TEXT',
                        }).then(async relic_squads => {
                            await relic_squads.setParent(category).catch(console.error)
                            const relic_squads_wh = await relic_squads.createWebhook('Relic',{avatar: 'https://cdn.discordapp.com/attachments/943131999189733387/1043978374089019462/relic_pack.png'}).catch(console.error)
                            db.query(`
                                INSERT INTO rb_channels (channel_id,webhook_url,guild_id,type,created_timestamp) VALUES ('${relic_squads.id}','${relic_squads_wh.url}','${guild_id}','relics_vaulted',${new Date().getTime()});
                            `).then(() => {
                                ['1','2','3','4','5','6'].forEach((val,index) => {
                                    var msg_type;
                                    if (index == 0) msg_type = 'recruitment_intro'
                                    if (index == 1) msg_type = 'fissures'
                                    if (index == 2) msg_type = 'lith_squads'
                                    if (index == 3) msg_type = 'meso_squads'
                                    if (index == 4) msg_type = 'neo_squads'
                                    if (index == 5) msg_type = 'axi_squads'
                                    relic_squads_wh.send('_ _').then(res => {
                                        db.query(`INSERT INTO rb_messages (message_id, channel_id, type, webhook_url) VALUES ('${res.id}', '${relic_squads.id}', '${msg_type}', '${relic_squads_wh.url}')`)
                                    }).catch(console.error)
                                })
                                setTimeout(assign_global_variables, 10000);
                                setTimeout(edit_recruitment_intro, 15000);
                                resolve({id: relic_squads.id})
                            }).catch(err => reject(err))
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

function rb_remove_server(guild_id) {
    return new Promise((resolve,reject) => {
        db.query(`
            SELECT * FROM rb_channels where guild_id='${guild_id}';
            DELETE FROM rb_guilds where guild_id='${guild_id}';
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

function embed(squads, tier, with_all_names, name_for_squad_id) {
    var fields = []
    var components = []
    squads = squads.sort(dynamicSort("main_relics"))
    squads.map((squad,index) => {
        var field_value = '\u200b'
        if (with_all_names || (name_for_squad_id && squad.squad_id == name_for_squad_id)) 
            field_value = squad.members.map(id => users_list[id]?.ingame_name).join('\n')
        else {
            if (squad.members.length > 2) field_value += ' ' + emote_ids.hot
            if (squad.is_steelpath) field_value += ' ' + emote_ids.steel_essence
            if (squad.is_railjack) field_value += ' ' + emote_ids.railjack
            if (squad.is_old) field_value += ' ' + emote_ids.cold
        }
        fields.push({
            name: `${squad.main_relics.join(' ').toUpperCase()} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ').toUpperCase()} ${squad.off_refinements.join(' ')} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim(),
            value: field_value,
            inline: true
        })
        // if (squads.length <= 12) {
        //     fields.push({
        //         name: '\u200b',
        //         value: '\u200b',
        //         inline: true
        //     })
        // }
        const k = Math.ceil((index + 1)/5) - 1
        if (!components[k]) components[k] = {type: 1, components: []}
        components[k].components.push({
            type: 2,
            label: `${squad.members.length > 2 ? emote_ids.hot:''} ${squad.is_old? emote_ids.cold:''} ${squad.main_relics.join(' ').toUpperCase()}`.replace(/\s+/g, ' ').trim(),
            style: squad.members.length > 1 ? 3 : 2,
            custom_id: `rb_sq_${squad.squad_id}`
        })
        if (index == squads.length - 1) {
            const k = Math.ceil((index + 2)/5) - 1
            if (!components[k]) components[k] = {type: 1, components: []}
            components[k].components.push({
                type: 2,
                label: "Squad Info",
                style: 1,
                custom_id: `rb_sq_info_${tier}`,
                disabled: with_all_names ? true : false
            })
        }
    })
    const msg = {
        content: '\u200b',
        embeds: fields.length == 0 ? []:[{
            title: `${emote_ids[tier]} ${convertUpper(tier)}`,
            description: '⸻'.repeat(13),
            fields: fields,
            color: tier == 'lith'? 'GREEN' : tier == 'meso' ? 'BLUE' : tier == 'neo' ? 'RED' : tier == 'axi' ? 'YELLOW' : ''
        }],
        components: components
    }
    return msg
}

var subscribersTimeout = {}
socket.on('squadCreate', (squad) => {
    console.log('[relicbot/squadCreate]')
    edit_webhook_messages(squad.tier, false,squad.squad_id)
    socket.emit('relicbot/trackers/fetchSubscribers',{squad: squad},(res) => {
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
                        content: `${relicBotSquadToString(squad)} ${discord_ids.map(id => `<@${id}>`).join(', ')}`
                    }).then(res => {
                        setTimeout(() => {
                            new WebhookClient({url: webhooks_list[channel_id]}).deleteMessage(res.id).catch(console.error)
                        }, 10000);
                    }).catch(console.error)
                }
            }
        }
    })
    vip_hosts(squad)
})

socket.on('squadUpdate', (payload) => {
    console.log('[relicbot/squadUpdate]')
    edit_webhook_messages(payload[0].tier, false,payload[0].squad_id)
    if (payload[0].members.length > payload[1].members.length) vip_hosts(payload[0])
})

const vip_hosts_list = ['825921976401002526','493552748613337098','230016515418619904']
var vip_hosts_timeouts = []
var vip_hosts_discarded_squad_ids = []
function vip_hosts(squad) {
    if (vip_hosts_discarded_squad_ids.includes(squad.squad_id)) return;
    vip_hosts_discarded_squad_ids.push(squad.squad_id)

    const user_ids = squad.members
    user_ids.forEach(user_id => {
        if (vip_hosts_list.includes(user_id) && !vip_hosts_timeouts.includes(user_id))  {
            vip_hosts_timeouts.push(user_id)
            setTimeout(() => {
                vip_hosts_timeouts = vip_hosts_timeouts.filter(id => id != user_id)
            }, 30000);
            sendMessage(`**${users_list[user_id].ingame_name}** ${squad.original_host == user_id ? 'is hosting':'has joined'} ${relicBotSquadToString(squad, true)}`)
        }
    })

    function sendMessage(message) {
        client.channels.cache.get('1063574659028766832').send(message).catch(console.error)
    }
}

const squadOpenMessages = {}
socket.on('relicbot/squads/opened', async (payload) => {
    // event_emitter.emit('relicbot_squad_filled',payload)
    console.log('[relicbot/squads/opened]')
    const squad = payload
    const thread_ids = []
    const channel_ids = {}
    for (const discord_id of squad.members) {
        const channel_id = squad.joined_from_channel_ids[discord_id]
        if (!channel_ids[channel_id]) channel_ids[channel_id] = []
        channel_ids[channel_id].push(discord_id)
    }
    //console.log('channel_ids:',channel_ids)
    //send dms
    for (const channel_id in channel_ids) {
        const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
        if (!channel) continue
        await channel.threads.create({
            name: convertUpper(`${squad.tier} ${squad.main_relics.join(' ')}`),
            autoArchiveDuration: 60,
            reason: 'Relic squad filled',
            type: 'private'
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
                    title: relicBotSquadToString(squad,true),
                    description: `Please decide a host and invite each other in the game\n\n/invite ${squad.members.map(id => enquote(users_list[id]?.ingame_name)).sort().join('\n/invite ').replace(/_/g, '\\_')}`,
                    footer: {
                        text: `This squad will auto-close in 15m`
                    }
                }],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: `What is ${squad.squad_type}?`,
                        style: 3,
                        custom_id: `as_faq_click.${squad.squad_type == '4b4' ? 'e8153f62-9329-11ed-b38a-0242ac1100a8' : '5d2d1c7c-938c-11ed-b5db-0242ac1100a8'}`,
                    },{
                        type: 2,
                        label: `Become Host`,
                        style: 1,
                        custom_id: `as_sq_become_host.relicbot.${squad.squad_id}`,
                    }]
                }]
            }).then(msg => {
                squadOpenMessages[`${squad.squad_id}_${thread.id}`] = msg
                axios('http://content.warframe.com/dynamic/worldState.php')
                .then( worldstateData => {
                    const fissures = new WorldState(JSON.stringify(worldstateData.data)).fissures.sort(dynamicSort("tierNum"));
                    if (!fissures) return

                    var fissures_list = []
                    fissures.forEach(fissure => {
                        if (fissure.tier.toLowerCase() == squad.tier) {
                            var expiry = new Date(fissure.expiry).getTime()
                            if ((expiry - new Date().getTime()) > 0) {
                                if (['Capture', 'Extermination', 'Disruption', 'Rescue', 'Sabotage'].includes(fissure.missionType)) {
                                    if (!['Stribog','Cervantes','Thebe'].includes(fissure.node.split(' (')[0]))
                                        fissures_list.push(fissure)
                                }
                            }
                        }
                    })

                    msg.edit({
                        content: msg.content,
                        embeds: [{
                            ...msg.embeds[0],
                            fields: [{
                                name: "Tier",
                                value: fissures_list.map(fissure => `${emote_ids[fissure.tier.toLowerCase()]} ${fissure.tier}`).join('\n'),
                                inline: true
                            },{
                                name: "Mission",
                                value: fissures_list.map(fissure => `${fissure.isHard ? emote_ids.steel_essence:fissure.isStorm ? emote_ids.railjack:''} ${fissure.missionType} - ${fissure.node}`.trim()).join('\n'),
                                inline: true
                            },{
                                name: "Expires",
                                value: fissures_list.map(fissure => `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>`).join('\n'),
                                inline: true
                            }]
                        }]
                    }).catch(console.error)
                }).catch(console.error)
            }).catch(console.error)
            if (Object.keys(channel_ids).length > 1) thread.send({content: 'This is a cross-server communication. Messages sent here will also be sent to respective members'}).catch(console.error)
            setTimeout(() => channel.messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        }).catch(console.error)
    }
    socket.emit('relicbot/squads/update',{params: `thread_ids='${JSON.stringify(thread_ids)}' WHERE squad_id='${squad.squad_id}' AND status='opened'`})
    logSquad(payload, false, 'squad_opened')
})

function enquote(username) {
    return username.match(' ') ? `"${username}"`:username
}

socket.on('relicbot/squads/closed', async (squad) => {
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
                }]
            }]
        }).then(res => {
            // channel.setArchived().catch(console.error)
        }).catch(console.error)
    })
    logSquad(squad, true, 'squad_closed')
})

socket.on('relicbot/squads/disbanded', async (payload) => {
    payload.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({content: `**⸻ Squad disbanded. A member joined another squad ⸻**`})
        .then(res => {
            channel.setArchived().catch(console.error)
        }).catch(console.error)
    })
    logSquad(payload, true, 'squad_disbanded')
})

socket.on('relicbot/squads/selectedhost', async (payload) => {
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
    if (include_chat) {
        socket.emit('relicbot/squads/messagesFetch', {squad_id: squad.squad_id}, async (res) => {
            if (res.code == 200) {
                channel.send({
                    content: convertUpper(action),
                    embeds: [{
                        title: relicBotSquadToString(squad,true),
                        description: `**Squad Fill Time:** ${msToFullTime(new Date().getTime() - Number(squad.creation_timestamp))}\n\n**⸻ Squad Members ⸻**\n${squad.members.map(id => users_list[id]?.ingame_name).join('\n')}\n\n**⸻ Squad Logs ⸻**\n${squad.logs.map(log => `${log.replace(log.split(' ')[0],`<t:${Math.round(Number(log.split(' ')[0])/1000)}:t>`).replace(log.split(' ')[1],`**${users_list[log.split(' ')[1]]?.ingame_name}**`)}`).join('\n')}\n\n**⸻ Squad Chat ⸻**\n${res.data.map(row => `[<t:${Math.round(Number(row.creation_timestamp) / 1000)}:t>] **${users_list[row.discord_id]?.ingame_name}:** ${row.message}`).join('\n')}`.replace(/_/g, '\\_'),
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
                            custom_id: `as_sq_validate.relicbot.${squad.squad_id}`
                        },{
                            type: 2,
                            label: "Invalidate",
                            emoji: "🛑",
                            style: 2,
                            custom_id: `as_sq_invalidate.relicbot.${squad.squad_id}`
                        }]
                    }]:[]
                }).catch(console.error)
            }
        })
    } else {
        channel.send({
            content: convertUpper(action),
            embeds: [{
                title: relicBotSquadToString(squad,true),
                description: `**⸻ Squad Members ⸻**\n${squad.members.map(id => users_list[id]?.ingame_name).join('\n')}`.replace(/_/g, '\\_'),
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
                    custom_id: `as_sq_validate.relicbot.${squad.squad_id}`
                },{
                    type: 2,
                    label: "Invalidate",
                    emoji: "🛑",
                    style: 2,
                    custom_id: `as_sq_invalidate.relicbot.${squad.squad_id}`
                }]
            }]:[]
        }).catch(console.error)
    }
}

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
                description: `<@${discord_id}> ${response.message || response.err || response.error}`,
                color: 'GREEN'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Join Existing",
                    style: 3,
                    custom_id: `rb_sq_merge_true_${response.squad_id}`
                },{
                    type: 2,
                    label: "Host New",
                    style: 1,
                    custom_id: `rb_sq_merge_false$${response.squad_code}`
                }]
            }],
            ephemeral: true
        }
    } else if (response.code == 299) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error}`,
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

function relicBotSquadToString(squad,include_sp_rj) {
    return `${convertUpper(squad.tier)} ${squad.main_relics.join(' ').toUpperCase()} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ').toUpperCase()} ${squad.off_refinements.join(' ')} ${include_sp_rj ? (squad.is_steelpath ? 'Steelpath':squad.is_railjack ? 'Railjack':''):''} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim()
}

function constructTrackersEmbed(trackers, ephemeral) {

    const component_options = trackers.reduce((arr,tracker,index) => {
        if (index < 25) {
            arr.push({
                label: `${relicBotSquadToString(tracker)} ${tracker.is_steelpath ? 'Steelpath':tracker.is_railjack ? 'Railjack':''}`,
                value: tracker.tracker_id,
                emoji: {
                    name: emote_ids[tracker.tier].replace('<:','').replace('>','').split(':')[0],
                    id: emote_ids[tracker.tier].replace('<:','').replace('>','').split(':')[1],
                }
            })
        }
        return arr
    },[])

    var payload = {
        content: ' ',
        embeds: [{
            title: 'Tracked Squads',
            color: 'WHITE',
            fields: [{
                name: 'Tier',
                value: '\u200b',
                inline: true
            },{
                name: 'Squad Name',
                value: '\u200b',
                inline: true
            }]
        }],
        components: component_options.length > 0 ? [{
            type: 1,
            components: [{
                    type: 3,
                    custom_id: "rb_sq_trackers_remove",
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
                    custom_id: "rb_sq_trackers_add_modal"
                },{
                    type: 2,
                    label: "Remove All",
                    style: 4,
                    custom_id: "rb_sq_trackers_remove_all"
            }]
        }] : [{
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Add Tracker",
                    style: 3,
                    custom_id: "rb_sq_trackers_add_modal"
                }
            ]
        }],
        ephemeral: ephemeral
    }
    trackers.forEach(tracker => {
        if (payload.embeds[0].fields[1].value.length < 1000) {
            payload.embeds[0].fields[0].value += `${convertUpper(tracker.tier)}` + '\n'
            payload.embeds[0].fields[1].value += relicBotSquadToString(tracker) + '\n'
        }
    })
    return payload
}

var fissuresTimer;
async function fissures_check() {
    console.log('[relicbot] fissures_check called')

    axios('http://content.warframe.com/dynamic/worldState.php')
    .then( worldstateData => {
        const fissures = new WorldState(JSON.stringify(worldstateData.data)).fissures.sort(dynamicSort("tierNum"));
        
        if (!fissures) {
            console.log('[relicbot] Fissures check: no data available')
            var timer = 300000
            fissuresTimer = setTimeout(fissures_check, timer)
            console.log(`[relicbot] fissures_check reset in ${msToTime(timer)}`)
            return
        }

        var fissures_list = []
        var min_expiry = Infinity
        var expiries = {}
        fissures.forEach(fissure => {
            if (fissure.tier == 'Requiem') return
            if (fissure.isStorm) return
            var expiry = new Date(fissure.expiry).getTime()
            if ((expiry - new Date().getTime()) > 0) {
                if (expiry < min_expiry) min_expiry = expiry
                const key = `${fissure.tier}${fissure.isHard ? '_SP':''}`
                if (!expiries[key]) expiries[key] = 0
                if (expiry > expiries[key]) expiries[key] = expiry
                if (['Capture', 'Extermination', 'Disruption', 'Rescue', 'Sabotage'].includes(fissure.missionType)) {
                    if (!['Stribog','Cervantes','Thebe'].includes(fissure.node.split(' (')[0]))
                        fissures_list.push(fissure)
                }
            }
        })

        Object.keys(expiries).forEach(key => {
            const reset_time = expiries[key] - 180000
            if (reset_time < min_expiry) min_expiry = reset_time
        })

        const payload = {
            content: ' ',
            embeds: [{
                title: "Fissures",
                description: fissures_list.length == 0 ? 'No good fissures at the time <:kekmask:935214374933659741>' : '',
                fields: fissures_list.length == 0 ? [] : [{
                    name: "Tier",
                    value: "\u200b",
                    inline: true
                },{
                    name: "Mission",
                    value: "\u200b",
                    inline: true
                },{
                    name: "Expires",
                    value: "\u200b",
                    inline: true
                },{
                    name: "Next Reset",
                    value: Object.keys(expiries).filter(e => !e.match('_SP')).map(key => `\`${key}\`: <t:${Math.round((expiries[key] - 180000)/1000)}:R>`).join('\n'),
                    inline: true
                },{
                    name: "\u200b",
                    value: Object.keys(expiries).filter(e => e.match('_SP')).map(key => `${emote_ids.steel_essence} \`${key.replace('_SP','')}\`: <t:${Math.round((expiries[key] - 180000)/1000)}:R>`).join('\n'),
                    inline: true
                }],
                color: 'WHITE'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Host Relic",
                    style: 3,
                    custom_id: `rb_sq_create_modal`
                },{
                    type: 2,
                    label: "Leave all",
                    style: 4,
                    custom_id: `rb_sq_leave_all`
                },{
                    type: 2,
                    label: "Track Relics",
                    style: 1,
                    custom_id: `rb_sq_trackers_add_modal`
                },{
                    type: 2,
                    label: "My Relics",
                    style: 2,
                    custom_id: `rb_sq_trackers_show`
                }]
            }]
        }

        fissures_list.forEach(fissure => {
            if (fissure.isHard) return
            payload.embeds[0].fields[0].value += `${emote_ids[fissure.tier.toLowerCase()]} ${fissure.tier}\n`
            payload.embeds[0].fields[1].value += `${fissure.missionType} - ${fissure.node}\n`
            payload.embeds[0].fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
        })
        payload.embeds[0].fields[0].value += `\n`
        payload.embeds[0].fields[1].value += `\n`
        payload.embeds[0].fields[2].value += `\n`
        fissures_list.forEach(fissure => {
            if (!fissure.isHard) return
            payload.embeds[0].fields[0].value += `${emote_ids[fissure.tier.toLowerCase()]} ${fissure.tier}\n`
            payload.embeds[0].fields[1].value += `${emote_ids.steel_essence} ${fissure.missionType} - ${fissure.node}\n`
            payload.embeds[0].fields[2].value += `<t:${Math.round(new Date(fissure.expiry).getTime() / 1000)}:R>\n`
        })

        webhook_messages.fissures?.forEach(msg => {
            new WebhookClient({url: msg.url}).editMessage(msg.m_id, translatePayload(payload, channels_list[msg.c_id].lang)).catch(console.error)
        })

        var timer = min_expiry - new Date().getTime()
        fissuresTimer = setTimeout(fissures_check, timer)
        console.log('[relicbot] fissures_check invokes in ' + msToTime(timer))
        return
    }).catch(err => {
        console.log(err)
        fissuresTimer = setTimeout(fissures_check,5000)
    })
}

module.exports = {
    channels_list
}