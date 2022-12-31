const {client} = require('./discord_client.js');
const {db} = require('./db_connection')
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./extras.js');
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');

const webhook_id = '1058463788560552028'
const channel_id = '1058462882968371331'
var webhook_client = null

const emotes = {
    affinity: '<:affinity:1058757765763453069>',
    credit: '<:credit:1058757768120651879>',
    resource_chance: '<:resource_chance:1058757775968174090>',
    damage: '<:damage:1058757770666590278>',
    health: '<:health:1058757772872781854>',
    shield: '<:shield:1058757778333761617>',
    north_america: '<:north_america:1058769080229842994>',
    europe: '<:europe:1058769078052991036>',
    asia: '<:asia:1058769075603509361>',
}

const colors = {
    affinity: '#dfef2a',
    credit: '#2a95ef',
    resource_chance: '#46ef2a',
    damage: '#ef792a',
    health: '#ef2a2a',
    shield: '#742aef'
}

client.on('ready', async () => {
    console.log('client is online')
    
    webhook_client = await client.fetchWebhook(webhook_id).catch(console.error)

    db.query(`SELECT * FROM as_bb_blesses WHERE status = 'active';`).then(res => {
        res.rows.forEach(blessing => {
            closeBlessing(blessing)
        })
    }).catch(console.error)

    edit_recruitment_intro()
})

client.on('interactionCreate', interaction => {
    if (interaction.channel.id == channel_id) {
        if (interaction.isButton()) {
            if (interaction.customId.match('as_bb_label.')) {
                interaction.deferUpdate().catch(console.error)
            } else if (interaction.customId.match('as_bb_option.')) {
                const key = interaction.customId.split('.')[1]
                const value = interaction.customId.split('.')[2]
                db.query(`UPDATE as_bb_blesses SET ${key} = '${value}' WHERE setup_message_id = '${interaction.message.id}' RETURNING *;`)
                .then(res => {
                    if (res.rowCount == 1) {
                        const blessing = res.rows[0]
                        const components = []
                        Object.keys(components_list).map((key) => {
                            if (!blessing[key] && components.length < 4) {
                                components.push(...components_list[key])
                            }
                        })
                        //console.log(JSON.stringify(components))
                        interaction.update(components.length == 0 ? {
                            embeds: [{
                                description: `Your blessing has been hosted in <#${channel_id}>`
                            }],
                            components: []
                        }:{
                            embeds: [{
                                description: '⸻'.repeat(10),
                                fields: Object.keys(components_list).map(key => ({name: convertUpper(key), value: convertUpper(blessing[key] || '\u200b'), inline: true}))
                            }],
                            components: components
                        }).catch(console.error)
                    }
                }).catch(console.error)
            } else if (interaction.customId == 'as_bb_host') {
                db.query(`SELECT * FROM as_bb_blesses WHERE discord_id = '${interaction.user.id}' AND status != 'setup' AND submit_timestamp > ${new Date().getTime() - 82800000}`).then(res => {
                    if (res.rowCount != 0) {
                        interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: `It seems you have already used your blessing for today.\nYou may bless again in **${msToFullTime((Number(res.rows[0].submit_timestamp) + 82800000) - new Date().getTime())}**`,
                                color: 'WHITE'
                            }],
                            ephemeral: true
                        }).catch(console.error)
                    } else {
                        interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: '⸻'.repeat(10),
                                fields: Object.keys(components_list).map(key => ({name: convertUpper(key), value: '\u200b', inline: true}))
                            }],
                            components: [...components_list.bless_type,...components_list.bless_time,...components_list.region,...components_list.relay],
                            ephemeral: true,
                            fetchReply: true
                        }).then(msg => {
                            db.query(`INSERT INTO as_bb_blesses (setup_message_id,discord_id) VALUES ('${msg.id}','${interaction.user.id}')`).catch(console.error)
                        }).catch(console.error)
                    }
                }).catch(console.error)
            } else if (interaction.customId == 'as_bb_participate') {
                db.query(`UPDATE as_bb_blesses SET participants = participants || '"${interaction.user.id}"' 
                WHERE bless_message_id = '${interaction.message.id}' AND status = 'active' AND NOT (participants @> '"${interaction.user.id}"') AND discord_id != '${interaction.user.id}'`)
                .then(res => interaction.deferUpdate().catch(console.error)).catch(console.error)
            }
        }
    }
})

client.on('messageReactionAdd', (reaction,user) => {
    if (reaction.message.channel.id == channel_id) {
        if (Object.values(emotes).map(str => getEmojiIdentifier(str)).includes(reaction.emoji.identifier)) {
            console.log('[blessbot]','messageReactionAdd',reaction.emoji.identifier,user.id)
            const column = (reaction.emoji.identifier.match('north_america') || reaction.emoji.identifier.match('europe') || reaction.emoji.identifier.match('asia')) ? 'regions' : 'bless_types'
            db.query(`
                INSERT INTO as_bb_trackers 
                (discord_id,${column}) 
                VALUES (
                    '${user.id}',
                    '["${reaction.emoji.name}"]'
                )
                ON CONFLICT (discord_id) 
                DO UPDATE SET 
                ${column} = as_bb_trackers.${column} || '"${reaction.emoji.name}"';
            `).catch(console.error)
        }
    }
})

client.on('messageReactionRemove', (reaction,user) => {
    if (reaction.message.channel.id == channel_id) {
        if (Object.values(emotes).map(str => getEmojiIdentifier(str)).includes(reaction.emoji.identifier)) {
            console.log('[blessbot]','messageReactionRemove',reaction.emoji.identifier,user.id)
            const column = (reaction.emoji.identifier.match('north_america') || reaction.emoji.identifier.match('europe') || reaction.emoji.identifier.match('asia')) ? 'regions' : 'bless_types'
            db.query(`
                UPDATE as_bb_trackers SET ${column} = ${column} - '${reaction.emoji.name}'
                WHERE discord_id = '${user.id}';
            `).catch(console.error)
        }
    }
})

function getEmojiIdentifier(emote) {
    return emote.replace('<:','').replace('>','')
}

const components_list = {
    bless_type: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Choose Blessing Type:',
            style: 2,
            custom_id: 'as_bb_label.bless_type'
        },{
            type: 2,
            label: 'Affinity',
            style: 3,
            custom_id: 'as_bb_option.bless_type.affinity',
            emoji: emotes.affinity
        },{
            type: 2,
            label: 'Credit',
            style: 3,
            custom_id: 'as_bb_option.bless_type.credit',
            emoji: emotes.credit
        },{
            type: 2,
            label: 'Resource Chance',
            style: 3,
            custom_id: 'as_bb_option.bless_type.resource_chance',
            emoji: emotes.resource_chance
        }]
    },{
        type: 1,
        components: [{
            type: 2,
            label: 'Damage',
            style: 3,
            custom_id: 'as_bb_option.bless_type.damage',
            emoji: emotes.damage
        },{
            type: 2,
            label: 'Health',
            style: 3,
            custom_id: 'as_bb_option.bless_type.health',
            emoji: emotes.health
        },{
            type: 2,
            label: 'Shield',
            style: 3,
            custom_id: 'as_bb_option.bless_type.shield',
            emoji: emotes.shield
        },]
    }],
    bless_time: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Bless Time:',
            style: 2,
            custom_id: 'as_bb_label.bless_time'
        },{
            type: 2,
            label: '1m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.1m'
        },{
            type: 2,
            label: '5m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.5m'
        },{
            type: 2,
            label: '10m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.10m'
        },{
            type: 2,
            label: '15m',
            style: 1,
            custom_id: 'as_bb_option.bless_time.15m'
        }]
    }],
    region: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Select Region:',
            style: 2,
            custom_id: 'as_bb_label.region'
        },{
            type: 2,
            label: 'North America',
            style: 1,
            custom_id: 'as_bb_option.region.north_america',
            emoji: emotes.north_america
        },{
            type: 2,
            label: 'Europe',
            style: 1,
            custom_id: 'as_bb_option.region.europe',
            emoji: emotes.europe
        },{
            type: 2,
            label: 'Asia',
            style: 1,
            custom_id: 'as_bb_option.region.asia',
            emoji: emotes.asia
        },]
    }],
    relay: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Select Relay:',
            style: 2,
            custom_id: 'as_bb_label.relay'
        },{
            type: 2,
            label: 'Larunda (Mercury)',
            style: 1,
            custom_id: 'as_bb_option.relay.larunda_(_mercury_)'
        },{
            type: 2,
            label: 'Strata (Earth)',
            style: 1,
            custom_id: 'as_bb_option.relay.strata_(_earth_)'
        }]
    }],
    instance: [{
        type: 1,
        components: [{
            type: 2,
            label: 'Select Instance (whichever available):',
            style: 2,
            custom_id: 'as_bb_label.instance'
        },{
            type: 2,
            label: '#1',
            style: 1,
            custom_id: 'as_bb_option.instance.#1'
        },{
            type: 2,
            label: '#2',
            style: 1,
            custom_id: 'as_bb_option.instance.#2'
        },{
            type: 2,
            label: '#3',
            style: 1,
            custom_id: 'as_bb_option.instance.#3'
        }]
    }],
}


db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    
    if (notification.channel == 'as_bb_blesses_update') {
        const blessing = payload[0]
        const old_blessing = payload[1]
        if (blessing.status == 'setup') {
            if (blessing.bless_type && blessing.bless_time && blessing.region && blessing.relay && blessing.instance) {
                const submit_timestamp = new Date().getTime()
                db.query(`
                    UPDATE as_bb_blesses SET submit_timestamp = ${submit_timestamp}, status = 'active' WHERE bless_id = '${blessing.bless_id}';
                    DELETE FROM as_bb_blesses WHERE discord_id = '${blessing.discord_id}' AND status = 'active';
                `).catch(console.error)
            }
        } else if (blessing.status == 'active' && old_blessing.status == 'setup') {
            webhook_client.send(embedGenerator(blessing)).then(msg => {
                db.query(`UPDATE as_bb_blesses SET bless_message_id = '${msg.id}' WHERE bless_id = '${blessing.bless_id}'`).catch(console.error)
            }).catch(console.error)
            closeBlessing(blessing)
            mentionUsers(blessing)
        } else if (blessing.status == 'closed' && old_blessing.status == 'active') {
            setTimeout(() => {
                webhook_client.deleteMessage(blessing.bless_message_id).catch(console.error)
            }, 60000);
            webhook_client.send({
                content: `${convertUpper(blessing.bless_type)} Blessing countdown has ended <@${blessing.discord_id}>, ${blessing.participants.map(id => `<@${id}>`).join(', ')}`
            }).then(msg => {
                setTimeout(() => {
                    webhook_client.deleteMessage(msg.id).catch(console.error)
                }, 60000);
            }).catch(console.error)
        } else {
            webhook_client.editMessage(blessing.bless_message_id, embedGenerator(blessing)).catch(console.error)
        }
    }
})

function mentionUsers(blessing) {
    db.query(`SELECT * FROM as_bb_trackers WHERE bless_types @> '"${blessing.bless_type}"' AND discord_id != '${blessing.discord_id}'`).then(res => {
        if (res.rowCount == 0) return
        const ping_users = []
        res.rows.forEach(tracker => {
            if (tracker.regions.length == 0) ping_users.push(tracker.discord_id)
            else if (tracker.regions.includes(blessing.region)) ping_users.push(tracker.discord_id)
        })
        if (ping_users.length > 0) {
            webhook_client.send({
                content: `${convertUpper(blessing.bless_type)} Blessing in ${blessing.bless_time}\n${ping_users.map(id => `<@${id}>`).join(', ')}`
            }).then(msg => {
                setTimeout(() => {
                    webhook_client.deleteMessage(msg.id)
                }, 30000);
            }).catch(console.error)
        }
    }).catch(console.error)
}

function closeBlessing(blessing) {
    setTimeout(() => {
        db.query(`UPDATE as_bb_blesses SET status = 'closed' WHERE bless_id = '${blessing.bless_id}' AND status = 'active';`).catch(console.error)
    }, (Number(blessing.submit_timestamp) + Number(blessing.bless_time.replace('m',''))*60*1000) - new Date().getTime());
}

function embedGenerator(blessing) {
    const bless_time = Math.round((Number(blessing.submit_timestamp) + Number(blessing.bless_time.replace('m',''))*60*1000) / 1000)
    return {
        content: ' ',
        embeds: [{
            title: `${emotes[blessing.bless_type]} ${convertUpper(blessing.bless_type)} Blessing`,
            description: `${blessing.participants.length} Participating\n${'⸻'.repeat(10)}`,
            fields: [{
                name: 'Region',
                value: convertUpper(blessing.region),
                inline: true
            },{
                name: 'Relay',
                value: convertUpper(blessing.relay),
                inline: true
            },{
                name: 'Instance',
                value: convertUpper(blessing.instance),
                inline: true
            },{
                name: 'Blessed by',
                value: `<@${blessing.discord_id}>`,
                inline: true
            },{
                name: 'Bless Time',
                value: `<t:${bless_time}:R> (<t:${bless_time}:t>)`,
                inline: true
            }],
            color: colors[blessing.bless_type]
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: 'Participate',
                style: 3,
                custom_id: 'as_bb_participate',
                emoji: '✋'
            }]
        }],
    }
}

function edit_recruitment_intro() {
    webhook_client.editMessage('1058464437138366514', {
        content: ' ',
        embeds: [{
            title: 'Warframe Blessing',
            description: 'Blessing boosts players\' grind for the next couple of hours. Help your fellow tennos in their journey!\n\nOnly Mastery Rank 30s or above can bless other players.\nWant to bless? Click the **Bless** button\n\nReact to be notified whenever someone blesses a booster of your liking!',
            color: '#2d7d46'
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: 'Bless',
                style: 3,
                custom_id: 'as_bb_host'
            }]
        }],
    }).catch(console.error)
}