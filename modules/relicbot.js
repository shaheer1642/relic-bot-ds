const {client} = require('./discord_client');
const {db} = require('./db_connection')

const server_commands_perms = [
    '253525146923433984', //softy
    '253980061969940481', //leo
    '353154275745988610', //john
    '385459793508302851' //ady
]

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
    
    if (interaction.customId == 'squad_info') {
        console.log(interaction.user.id,'clicked squad_info')
        interaction.deferUpdate().catch(console.error)
        edit_relic_squads(true)
        setTimeout(() => {
            edit_relic_squads(false)
        }, 5000);
    }
})


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

const pnames = [
    'player 1\nplayer2\nplayer3',
    'player 1\nplayer2',
    'player 1'
]

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function field(with_names, relic) {
    const alph = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"].sort(() => Math.random() - 0.5)
    const cycle = ["", "", "", "", "", "(4+ cycles)"].sort(() => Math.random() - 0.5)
    const num = ["1", "2", "3", "4", "5", "6"].sort(() => Math.random() - 0.5)
    const rot = ["1b1", "2b2", "3b3", "4b4"].sort(() => Math.random() - 0.5)
    const refine = ["int", "exc", "flaw", "rad"].sort(() => Math.random() - 0.5)
    const text = ['player 1\nplayer2\nplayer3','player 1\nplayer2','player 1'].sort(() => Math.random() - 0.5)
    return {
        name: `${alph[0]}${num[0]} ${rot[0]} ${refine[0]} ${cycle[0]}`,
        value: with_names ? text[0] : text[0] == 'player 1\nplayer2\nplayer3' ? '🔥' : '\u200b',
        inline: true
    }
}

function embed(with_names, tier) {
    const relics = Array.from(Array(24).keys()).map(() => field(with_names)).sort(dynamicSort("name"))
    const msg = {
        content: ' ',
        embeds: [{
            title: tier,
            description: ('━').repeat(34),
            fields: relics,
            color: tier == 'Lith'? 'RED' : 'BLUE'
        }],
        components: [
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 5) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 10 || index <= 4) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 15 || index <= 9) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 20 || index <= 14) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                }).filter(value => Object.keys(value).length !== 0)
            },
            {
                type: 1,
                components: relics.map((relic,index) => {
                    if (index >= 25 || index <= 19) return {}
                    return {
                        type: 2,
                        label: relic.name.split(' ')[0],
                        style: relic.value == 'player 1\nplayer2\nplayer3' || relic.value == '🔥' ? 3:2,
                        custom_id: relic.name.split(' ')[0] + Math.random() * 100
                    }
                    
                }).filter(value => Object.keys(value).length !== 0)
            },
        ]
    }
    msg.components[4].components.push({
        type: 2,
        label: "Squad Info",
        style: 1,
        custom_id: "squad_info"
    })
    return msg
}

client.on('ready', async () => {
    edit_relic_squads(false)
})

async function edit_relic_squads(with_names) {
    (await client.fetchWebhook('1043648178941087746')).editMessage('1043648496319864962', embed(with_names, 'Lith'));
    (await client.fetchWebhook('1043648178941087746')).editMessage('1043649645705965599', embed(with_names, 'Meso'));
}