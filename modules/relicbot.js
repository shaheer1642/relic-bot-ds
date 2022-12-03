const {client} = require('./discord_client');
const {db} = require('./db_connection')
const uuid = require('uuid')
const { WebhookClient } = require('discord.js');
const JSONbig = require('json-bigint');
const {socket} = require('./socket')
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./extras.js');

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
        edit_recruitment_intro()
        edit_leaderboard()
        setInterval(edit_leaderboard, 900000);
    }).catch(console.error)
    update_users_list()
})

function edit_leaderboard() {
    socket.emit('relicbot/stats/fetch', {}, (res) => {
        const payload = {
            content: ' ',
            embeds: [{
                title: 'All-time Leaderboard',
                description: ('━').repeat(34),
                fields: [{
                    name: 'Rank',
                    value: res.data.map((user,index) => `${index+1}`).join('\n'),
                    inline: true
                },{
                    name: 'Player',
                    value: res.data.map(user => `${user.ingame_name}`).join('\n'),
                    inline: true
                },{
                    name: 'Squads',
                    value: res.data.map(user => `${user.squads_completed}`).join('\n'),
                    inline: true
                },],
                color: 'WHITE'
            }]
        }
        console.log(JSON.stringify(payload))
        if (res.code == 200) {
            new WebhookClient({url: webhooks_list['892006071030403072']}).editMessage('1048634340579475466', payload).catch(console.error)
        }
    })
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

client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (message.channel.isText() && Object.keys(channels_list).includes(message.channel.id) && ['relics_vaulted','relics_non_vaulted'].includes(channels_list[message.channel.id].type)) {
        if (server_commands_perms.includes(message.author.id) && message.content.toLowerCase().split(' ')[0] == 'persist') return
        console.log('[relicbot messageCreate] content:',message.content)
        socket.emit('relicbot/squads/create',{message: message.content, discord_id: message.author.id, channel_id: message.channel.id, channel_vaulted: channels_list[message.channel.id].type == 'relics_vaulted' ? true:false},responses => {
            //console.log('[relicbot/squads/create] response',responses)
            handleSquadCreateResponses(message.channel.id,message.author.id,responses)
            setTimeout(() => message.delete().catch(console.error), 1000);
        })
    }
    if (message.channel.isThread() && Object.keys(channels_list).includes(message.channel.parent?.id)) {
        if (message.channel.ownerId == client.user.id) {
            socket.emit('relicbot/squads/messageCreate', {
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

        if (interaction.customId == 'rb_sq_leave_all') {
            socket.emit('relicbot/squads/leaveall',{discord_id: interaction.user.id},(res) => {
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
                    edit_webhook_messages(res.data, tier, true, null, interaction.channel.id)
                } else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId.match('rb_sq_merge_false')) { 
            socket.emit('relicbot/squads/create',{message: interaction.customId.split('$')[1].replace(/_/g,' '), discord_id: interaction.user.id, channel_id: interaction.channel.id, channel_vaulted: channels_list[interaction.channel.id].type == 'relics_vaulted' ? true:false, merge_squad: false}, responses => {
                interaction.deferUpdate().catch(console.error)
                handleSquadCreateResponses(interaction.channel.id,interaction.user.id,responses)
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
                console.log(responses)
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
        }
        if (interaction.customId == 'rb_sq_create') {
            //console.log('[relicbot rb_sq_create] content:',message.content)
            socket.emit('relicbot/squads/create',{message: interaction.fields.getTextInputValue('squad_name'), discord_id: interaction.user.id, channel_id: interaction.channel.id, channel_vaulted: channels_list[message.channel.id].type == 'relics_vaulted' ? true:false},responses => {
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
function edit_webhook_messages(squads,tier,with_all_names,name_for_squad_id, single_channel_id) {
    clearTimeout(timeout_edit_webhook_messages[tier])
    timeout_edit_webhook_messages[tier] = setTimeout(() => {
        const msg_payload_vaulted = embed(squads,tier,with_all_names,name_for_squad_id,true)
        const msg_payload_non_vaulted = embed(squads,tier,with_all_names,name_for_squad_id,false)
        webhook_messages[tier + '_squads'].forEach(msg => {
            if (!single_channel_id || single_channel_id == msg.c_id)
                new WebhookClient({url: msg.url}).editMessage(msg.m_id, msg.c_type == 'relics_vaulted' ? msg_payload_vaulted : msg_payload_non_vaulted).catch(console.error)
        })
    }, 500)
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
                description: '< recruitment intro/tutorial >',
                color: 'WHITE'
            }],
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: "Verify",
                    style: 1,
                    custom_id: `tb_verify`
                },{
                    type: 2,
                    label: "Host Squad",
                    style: 3,
                    custom_id: `rb_sq_create_modal`
                },{
                    type: 2,
                    label: "Leave all",
                    style: 4,
                    custom_id: `rb_sq_leave_all`
                }]
            },{
                type: 1,
                components: [{
                    type: 2,
                    label: "Track Squads",
                    style: 2,
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
                        }).then(relic_squads => {
                            guild.channels.create('•🔮•relic-squads-non-vaulted',{
                                type: 'GUILD_TEXT',
                            }).then(async relic_squads_nv => {
                                await relic_squads.setParent(category).catch(console.error)
                                await relic_squads_nv.setParent(category).catch(console.error)
                                const relic_squads_wh = await relic_squads.createWebhook('Relic',{avatar: 'https://cdn.discordapp.com/attachments/943131999189733387/1043978374089019462/relic_pack.png'}).catch(console.error)
                                const relic_squads_nv_wh = await relic_squads_nv.createWebhook('Relic',{avatar: 'https://cdn.discordapp.com/attachments/943131999189733387/1043978374089019462/relic_pack.png'}).catch(console.error)
                                db.query(`
                                    INSERT INTO rb_channels (channel_id,webhook_url,guild_id,type,created_timestamp) VALUES ('${relic_squads.id}','${relic_squads_wh.url}','${guild_id}','relics_vaulted',${new Date().getTime()});
                                    INSERT INTO rb_channels (channel_id,webhook_url,guild_id,type,created_timestamp) VALUES ('${relic_squads_nv.id}','${relic_squads_nv_wh.url}','${guild_id}','relics_non_vaulted',${new Date().getTime()});
                                `).then(() => {
                                    ['1','2','3','4','5'].forEach((val,index) => {
                                        var msg_type;
                                        if (index == 0) msg_type = 'recruitment_intro'
                                        if (index == 1) msg_type = 'lith_squads'
                                        if (index == 2) msg_type = 'meso_squads'
                                        if (index == 3) msg_type = 'neo_squads'
                                        if (index == 4) msg_type = 'axi_squads'
                                        relic_squads_wh.send('--').then(res => {
                                            db.query(`INSERT INTO rb_messages (message_id, channel_id, type, webhook_url) VALUES ('${res.id}', '${relic_squads.id}', '${msg_type}', '${relic_squads_wh.url}')`)
                                        }).catch(console.error)
                                        relic_squads_nv_wh.send('--').then(res => {
                                            db.query(`INSERT INTO rb_messages (message_id, channel_id, type, webhook_url) VALUES ('${res.id}', '${relic_squads_nv.id}', '${msg_type}', '${relic_squads_nv_wh.url}')`)
                                        }).catch(console.error)
                                    })
                                    resolve({id: relic_squads.id})
                                }).catch(err => reject(err))
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
                    channel.send('This server has been unaffiliated from WarframeHub. Farewell!').catch(console.error)
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
            name: `${squad.main_relics.join(' ')} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ')} ${squad.off_refinements.join(' ')} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim(),
            value: field_value,
            inline: true
        })
        const k = Math.ceil((index + 1)/5) - 1
        if (!components[k]) components[k] = {type: 1, components: []}
        components[k].components.push({
            type: 2,
            label: `${squad.members.length > 2 ? emote_ids.hot:''} ${squad.is_old? emote_ids.cold:''} ${squad.main_relics.join(' ')}`.replace(/\s+/g, ' ').trim(),
            style: 2,
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

socket.on('squadCreate', (squad) => {
    console.log('[squadCreate]',squad)
    const tier = squad.tier
    socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(res.data, tier, false,squad.squad_id)
        }
    })
    socket.emit('relicbot/trackers/fetchSubscribers',{squad: squad},(res) => {
        if (res.code == 200) {
            const channel_ids = res.data
            for (const channel_id in channel_ids) {
                const discord_ids = channel_ids[channel_id]
                new WebhookClient({url: webhooks_list[channel_id]}).send({
                    content: `${relicBotSquadToString(squad)} ${discord_ids.map(id => `<@${id}>`).join(', ')}`
                }).then(res => {
                    setTimeout(() => {
                        new WebhookClient({url: webhooks_list[channel_id]}).deleteMessage(res.id).catch(console.error)
                    }, 10000);
                }).catch(console.error)
            }
        }
    })
})

socket.on('squadUpdate', (payload) => {
    console.log('[squadUpdate]',payload)
    const squad = payload[0]
    socket.emit('relicbot/squads/fetch',{tier: squad.tier},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(res.data, squad.tier, false,squad.squad_id)
        }
    })
})

socket.on('relicbot/squads/opened', async (payload) => {
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
    for (const channel_id in channel_ids) {
        const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
        if (!channel) continue
        await channel.threads.create({
            name: `${convertUpper(squad.tier)} ${squad.main_relics.join(' ')}`,
            autoArchiveDuration: 60,
            reason: 'Relic squad filled'
        }).then(async thread => {
            thread_ids.push(thread.id)
            thread.send({
                content: `Squad filled ${channel_ids[channel_id].map(m => `<@${m}>`).join(', ')}`,
                embeds: [{
                    description: `**${relicBotSquadToString(squad)}**\n\n/invite ${squad.members.map(id => users_list[id]?.ingame_name).join('\n/invite ')}`
                }]
            }).catch(console.error)
            if (Object.keys(channel_ids).length > 1) thread.send({content: 'This is a cross-server communication. Messages sent here will also be sent to respective members'}).catch(console.error)
            setTimeout(() => channel.messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
        }).catch(console.error)
    }
    socket.emit('relicbot/squads/update',{params: `thread_ids='${JSON.stringify(thread_ids)}' WHERE squad_id='${squad.squad_id}' AND status='opened'`})
})

socket.on('relicbot/squads/closed', async (payload) => {
    payload.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({content: `**--- Squad closed ---**`}).catch(console.error)
        channel.setArchived().catch(console.error)
    })
})

socket.on('relicbot/squads/disbanded', async (payload) => {
    payload.thread_ids.forEach(async thread_id => {
        const channel = client.channels.cache.get(thread_id) || await client.channels.fetch(thread_id).catch(console.error)
        if (!channel) return
        channel.send({content: `**--- Squad disbanded. A member joined another squad ---**`}).catch(console.error)
        channel.setArchived().catch(console.error)
    })
})

socket.on('tradebotUsersUpdated', (payload) => {
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
            }]
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
                    custom_id: `rb_sq_${response.squad_id}`
                },{
                    type: 2,
                    label: "Host New",
                    style: 3,
                    custom_id: `rb_sq_merge_false$${response.squad_code}`
                }]
            }]
        }
    } else {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || response.err || response.error || 'error'}`,
                color: 'RED'
            }]
        }
    }
}

function relicBotSquadToString(squad) {
    return `${convertUpper(squad.tier)} ${squad.main_relics.join(' ')} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ')} ${squad.off_refinements.join(' ')} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim()
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