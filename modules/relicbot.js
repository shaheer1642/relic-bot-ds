const {client} = require('./discord_client');
const {db} = require('./db_connection')
const uuid = require('uuid')
const { WebhookClient } = require('discord.js');
const JSONbig = require('json-bigint');
const {socket} = require('./socket')

const server_commands_perms = [
    '253525146923433984', //softy
    '253980061969940481', //leo
    '353154275745988610', //john
    '385459793508302851' //ady
]

const webhook_messages = {}
const channels_list = []

client.on('ready', async () => {
    assign_global_variables()
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (!channels_list.includes(message.channel.id)) return
    console.log('[relicbot messageCreate] content:',message.content)
    socket.emit('relicbot/squads/create',{message: message.content, discord_id: message.author.id},responses => {
        var flag = true
        responses.forEach(res => {
            if (res.code != 200) {
                flag = false
                console.log(res)
                message.channel.send({content: res.message || 'error'}).catch(console.error)
            }
        })
        if (flag)
            setTimeout(() => message.delete().catch(console.error), 1000);
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
        if (interaction.customId.match('rb_sq_')) {
            const squad_id = interaction.customId.split('rb_sq_')[1]
            const discord_id = interaction.user.id
            socket.emit('relicbot/squads/addmember',{squad_id: squad_id,discord_id: discord_id},(res) => {
                if (res.code == 200) interaction.deferUpdate().catch(console.error)
                else interaction.reply({content: res.message || 'error'}).catch(console.error)
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

function edit_webhook_messages(squads,tier) {
    const msg_payload = embed(squads,tier,false)
    webhook_messages[tier + '_squads'].forEach(msg => {
        new WebhookClient({url: msg.url}).editMessage(msg.m_id, msg_payload).catch(console.error)
    })
}

function assign_global_variables() {
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
    }).catch(console.error)
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

function embed(squads, tier, with_names) {
    var fields = []
    var components = []
    squads.map((squad,index) => {
        fields.push({
            name: `${squad.tier} ${squad.relic}`,
            value: squad.members.map(m => `<@${m}>`).join('\n'),
            inline: true
        })
        const k = Math.ceil((index + 1)/5) - 1
        if (!components[k]) components[k] = {type: 1, components: []}
        components[k].components.push({
            type: 2,
            label: squad.relic,
            style: 2,
            custom_id: `rb_sq_${squad.squad_id}`
        })
    })
    const msg = {
        content: ' ',
        embeds: [{
            title: tier,
            description: ('━').repeat(34),
            fields: fields,
            color: tier == 'lith'? 'RED' : tier == 'meso' ? 'BLUE' : tier == 'neo' ? 'ORANGE' : tier == 'axi' ? 'YELLOW' : ''
        }],
        components: components
    }
    /*
    msg.components[4].components.push({
        type: 2,
        label: "Squad Info",
        style: 1,
        custom_id: "squad_info"
    })
    */
    return msg
}

socket.on('squadCreate', (squad) => {
    console.log('[squadCreate]',squad)
    const tier = squad.tier
    socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(res.data, tier)
        }
    })
})

socket.on('squadUpdate', (squad) => {
    console.log('[squadUpdate]',squad)
    const tier = squad[0].tier
    socket.emit('relicbot/squads/fetch',{tier: tier},(res) => {
        if (res.code == 200) {
            edit_webhook_messages(res.data, tier)
        }
    })
})

module.exports = {
    channels_list
}