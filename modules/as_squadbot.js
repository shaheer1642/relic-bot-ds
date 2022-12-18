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

client.on('ready', async () => {
    assign_global_variables().then(() => {
        //edit_recruitment_intro()
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

client.on('messageCreate', async (message) => {
    if (message.author.bot) return
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
function edit_webhook_messages(squads,tier,with_all_names,name_for_squad_id, single_channel_id) {
    clearTimeout(timeout_edit_webhook_messages[tier])
    timeout_edit_webhook_messages[tier] = setTimeout(() => {
        const msg_payload_vaulted = embed(squads,tier,with_all_names,name_for_squad_id,true)
        const msg_payload_non_vaulted = embed(squads,tier,with_all_names,name_for_squad_id,false)
        webhook_messages[tier + '_squads'].forEach(msg => {
            if (!single_channel_id || single_channel_id == msg.c_id)
                new WebhookClient({url: msg.url}).editMessage(msg.m_id, msg.c_type == 'relics_vaulted' ? msg_payload_vaulted : msg_payload_non_vaulted).catch(console.error)
        })
    }, new Date().getTime() - edit_webhook_messages_time_since_last_call > 1000 ? 0 : 500)
    clearTimeout(timeout_edit_webhook_messages_reset[tier])
    timeout_edit_webhook_messages_reset[tier] = setTimeout(() => {
        const msg_payload_vaulted = embed(squads,tier,null,null,true)
        const msg_payload_non_vaulted = embed(squads,tier,null,null,false)
        console.log('msg_payload_vaulted',JSON.stringify(msg_payload_vaulted))
        console.log('msg_payload_non_vaulted',JSON.stringify(msg_payload_non_vaulted))
        webhook_messages[tier + '_squads'].forEach(msg => {
            //if (!single_channel_id || single_channel_id == msg.c_id)
                new WebhookClient({url: msg.url}).editMessage(msg.m_id, msg.c_type == 'relics_vaulted' ? msg_payload_vaulted : msg_payload_non_vaulted).catch(console.error)
        })
    }, 3000);
    edit_webhook_messages_time_since_last_call = new Date().getTime()
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

function edit_recruitment_intro() {
    webhook_messages.recruitment_intro?.forEach(msg => {
        new WebhookClient({url: msg.url}).editMessage(msg.m_id, {
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
                    "value": "❄️ Squad hosted 15m ago\n🔥 Squad is 3/4",
                    "inline": true
                  },
                  {
                    "name": "Track Squads",
                    "value": "Add relics to be notified whenever someone hosts them",
                    "inline": true
                  }
                ]
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Host Squad",
                    style: 3,
                    custom_id: `rb_sq_create_modal`
                },{
                    type: 2,
                    label: "Leave all",
                    style: 4,
                    custom_id: `rb_sq_leave_all`
                },{
                    type: 2,
                    label: "Track Squads",
                    style: 1,
                    custom_id: `rb_sq_trackers_add_modal`
                },{
                    type: 2,
                    label: "Show Trackers",
                    style: 2,
                    custom_id: `rb_sq_trackers_show`
                }]
            }]
        }).catch(console.error)
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
                            for (const val of ['1','2','3','4','5']) {
                                var msg_type;
                                if (index == 0) msg_type = 'find_squads_1'
                                if (index == 1) msg_type = 'find_squads_2'
                                if (index == 2) msg_type = 'find_squads_3'
                                if (index == 3) msg_type = 'find_squads_4'
                                if (index == 4) msg_type = 'find_squads_5'
                                await find_squads_wh.send('_ _').then(res => {
                                    db.query(`INSERT INTO rb_messages (message_id, channel_id, type, webhook_url) VALUES ('${res.id}', '${find_squads.id}', '${msg_type}', '${find_squads.url}')`)
                                }).catch(console.error)
                            }
                            setTimeout(assign_global_variables, 10000);
                            //setTimeout(edit_recruitment_intro, 15000);
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

function embed(squads, tier, with_all_names, name_for_squad_id, vaulted) {
    var fields = []
    var components = []
    squads = squads.sort(dynamicSort("main_relics")).filter(squad => vaulted ? squad.is_vaulted == true: squad.is_vaulted == false)
    squads.map((squad,index) => {
        if ((vaulted && !squad.is_vaulted) || (!vaulted && squad.is_vaulted)) return
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
                custom_id: `rb_sq_info_${tier}`
            })
        }
    })
    const msg = {
        content: '\u200b',
        embeds: fields.length == 0 ? []:[{
            title: convertUpper(tier),
            description: ('━').repeat(34),
            fields: fields,
            color: tier == 'lith'? 'RED' : tier == 'meso' ? 'BLUE' : tier == 'neo' ? 'ORANGE' : tier == 'axi' ? 'YELLOW' : ''
        }],
        components: components
    }
    return msg
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

function relicBotSquadToString(squad) {
    return `${convertUpper(squad.tier)} ${squad.main_relics.join(' ').toUpperCase()} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ').toUpperCase()} ${squad.off_refinements.join(' ')} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim()
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
            },{
                name: 'Fissure Type',
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
        payload.embeds[0].fields[0].value += `${emote_ids[tracker.tier]} ${convertUpper(tracker.tier)}` + '\n'
        payload.embeds[0].fields[1].value += relicBotSquadToString(tracker) + '\n'
        payload.embeds[0].fields[2].value += tracker.is_steelpath ? `${emote_ids.steel_essence} Steelpath` : tracker.is_railjack ? `${emote_ids.railjack} Railjack` : 'Normal' + '\n'
    })
    return payload
}

module.exports = {
    channels_list
}