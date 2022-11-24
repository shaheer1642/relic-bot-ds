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
const channels_list = []

const emote_ids = {
    steel_essence: '<:steel_essence:962508988442869800>',
    railjack: '<:railjack:1045456185429594214>',
    hot: '🔥',
    cold: '❄️'
}

client.on('ready', async () => {
    assign_global_variables().then(() => edit_recruitment_intro()).catch(console.error)
    update_users_list()
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (!channels_list.includes(message.channel.id)) return
    console.log('[relicbot messageCreate] content:',message.content)
    socket.emit('relicbot/squads/create',{message: message.content, discord_id: message.author.id, channel_id: message.channel.id},responses => {
        //console.log('[relicbot/squads/create] response',responses)
        var flag = true
        if (Array.isArray(responses)) {
            responses.forEach(res => {
                if (res.code != 200) {
                    flag = false
                    console.log(res)
                    message.channel.send(error_codes_embed(res,message.author.id)).catch(console.error)
                }
            })
        } else {
            if (responses.code != 200) {
                flag = false
                console.log(responses)
                message.channel.send(error_codes_embed(responses,message.author.id)).catch(console.error)
            }
        }
        if (flag) setTimeout(() => message.delete().catch(console.error), 1000);
    })
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
        if (!channels_list.includes(interaction.channel.id)) return
        if (interaction.customId == 'rb_sq_leave_all') {
            socket.emit('relicbot/squads/leaveall',{discord_id: interaction.user.id},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        }
        else if (interaction.customId.match('rb_sq_info_')) {
            const tier = interaction.customId.split('rb_sq_info_')[1]
            socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
                if (res.code == 200) {
                    interaction.deferUpdate().catch(console.error)
                    edit_webhook_messages(res.data, tier, true, null, interaction.channel.id)
                } else {
                    interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
                }
            })
        } else if (interaction.customId.match('rb_sq_')) {
            const squad_id = interaction.customId.split('rb_sq_')[1]
            const discord_id = interaction.user.id
            socket.emit('relicbot/squads/addmember',{squad_id: squad_id,discord_id: discord_id},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else interaction.reply(error_codes_embed(res,interaction.user.id)).catch(console.error)
            })
        }
    }
})

var squads_list = []

class Squad {
    constructor(tier, relic, host) {
        this.squad_id = uuid.v4()
        this.tier = tier
        this.relic = relic
        this.host = host
    }
}

var timeout_edit_webhook_messages = {
    lith: null,
    meso: null,
    neo: null,
    axi: null,
}
function edit_webhook_messages(squads,tier,with_all_names,name_for_squad_id, single_channel_id) {
    const msg_payload = embed(squads,tier,with_all_names,name_for_squad_id)
    webhook_messages[tier + '_squads'].forEach(msg => {
        if (!single_channel_id || single_channel_id == msg.c_id)
            new WebhookClient({url: msg.url}).editMessage(msg.m_id, msg_payload).catch(console.error)
    })
    clearTimeout(timeout_edit_webhook_messages[tier])
    timeout_edit_webhook_messages[tier] = setTimeout(() => {
        const msg_payload = embed(squads,tier)
        webhook_messages[tier + '_squads'].forEach(msg => {
            //if (!single_channel_id || single_channel_id == msg.c_id)
                new WebhookClient({url: msg.url}).editMessage(msg.m_id, msg_payload).catch(console.error)
        })
    }, 3000);
}

function assign_global_variables() {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM rb_messages`)
        .then(res => {
            res.rows.forEach((row) => {
                if (!webhook_messages[row.type]) webhook_messages[row.type] = []
                if (!channels_list.includes(row.channel_id)) channels_list.push(row.channel_id)
                if (!webhook_messages[row.type].find(obj => obj.m_id == row.message_id)) {
                    webhook_messages[row.type].push({
                        m_id: row.message_id,
                        c_id: row.channel_id,
                        url: row.webhook_url
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
                    label: "Leave all",
                    style: 4,
                    custom_id: `rb_sq_leave_all`
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
            if ((new Date().getTime() - squad.creation_timestamp) > 900000) field_value += ' ' + emote_ids.cold
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
            label: squad.main_relics.join(' '),
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
        content: ' ',
        embeds: [{
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

socket.on('squadUpdate/open', async (payload) => {
    console.log('[squadUpdate/open]',payload)
    const squad = payload[0]
    const channel = client.channels.cache.get(squad.channel_id) || await client.channels.fetch(squad.channel_id).catch(console.error)
    if (!channel) return
    channel.threads.create({
        name: `${convertUpper(squad.tier)} ${squad.main_relics.join(' ')}`,
        autoArchiveDuration: 60,
        reason: 'Relic squad filled'
    }).then(async thread => {
        thread.send({
            content: `Squad filled ${squad.members.map(m => `<@${m}>`).join(', ')}`,
            embeds: [{
                description: `**${`${convertUpper(squad.tier)} ${squad.main_relics.join(' ')} ${squad.squad_type} ${squad.main_refinements.join(' ')} ${squad.off_relics.length > 0 ? 'with':''} ${squad.off_relics.join(' ')} ${squad.off_refinements.join(' ')} ${squad.cycle_count == '' ? '':`(${squad.cycle_count} cycles)`}`.replace(/\s+/g, ' ').trim()}**\n\n/invite ${squad.members.map(id => users_list[id]?.ingame_name).join('\n/invite ')}`
            }]
        }).catch(console.error)
        setTimeout(() => channel.messages.cache.get(thread.id)?.delete().catch(console.error), 5000)
    }).catch(console.error)
})

socket.on('tradebotUsersUpdated', (payload) => {
    update_users_list()
})

function error_codes_embed(response,discord_id) {
    if (response.code == 499) {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> Please verify your Warframe account to access this feature\nClick Verify to proceed`,
                color: 'RED'
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
    } else {
        return {
            content: ' ',
            embeds: [{
                description: `<@${discord_id}> ${response.message || 'error'}`,
                color: 'RED'
            }]
        }
    }
}

module.exports = {
    channels_list
}