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

const guild_id = '865904902941048862'
const channel_id = '1052213356460769432'

function replyAndDelete(channel, message) {
    channel.send({
        content: message
    }).then(msg => {
        setTimeout(() => {
            msg.delete().catch(console.error)
        }, 10000);
    }).catch(console.error)
}

function closeGiveaway(giveaway_id, expiry_timestamp) {
    setTimeout(() => {
        db.query(`
            UPDATE as_gabot_giveaways SET status = 'closed' WHERE giveaway_id='${giveaway_id}' AND status = 'opened'
        `).catch(console.error)
    }, expiry_timestamp - new Date().getTime());
}

client.on('messageReactionAdd', async (reaction,user) => {
    if (user.bot) return

    if (reaction.message.guild.id == guild_id && reaction.message.channel.id == channel_id && reaction.emoji.name == '🎉') {
        if (!reaction.message.author)
            reaction.message = await client.channels.cache.get(reaction.message.channel.id).messages.fetch(reaction.message.id).catch(console.error)
        if (!reaction.message) {
            reaction.users.remove(user.id).catch(console.error)
            return
        }
        if (!reaction.message.author.bot) return
        db.query(`
            SELECT * FROM as_gabot_giveaways WHERE message_id = '${reaction.message.id}';
            SELECT * FROM challenges_accounts WHERE discord_id = ${user.id};
        `).then(res => {
            const giveaway = res[0].rows[0]
            const user_account = res[1].rows[0]
            if (!giveaway) return reaction.users.remove(user.id).catch(console.error)
            if (!user_account) {
                reaction.users.remove(user.id).catch(console.error)
                return replyAndDelete(reaction.message.channel, `<@${user.id}> You do not have enough RP to join this giveaway. Current RP: 0`)
            }
            if (user_account.balance < giveaway.rp_cost) {
                reaction.users.remove(user.id).catch(console.error)
                return replyAndDelete(reaction.message.channel, `<@${user.id}> You do not have enough RP to join this giveaway. Current RP: ${user_account.balance}`)
            }
            if (giveaway.discord_id == user.id) {
                reaction.users.remove(user.id).catch(console.error)
                return replyAndDelete(reaction.message.channel, `<@${user.id}> Cannot join your own giveaway`)
            }
            if (giveaway.join_list.includes(user.id)) {
                return replyAndDelete(reaction.message.channel, `<@${user.id}> You have already joined this giveaway`)
            }
            db.query(`
                INSERT INTO challenges_transactions
                (transaction_id,discord_id,type,rp,balance_type,timestamp, guild_id)
                VALUES ('${uuid.v4()}',${user.id},'giveaway_join',${giveaway.rp_cost},'debit',${new Date().getTime()},'${reaction.message.guild.id}');
                UPDATE as_gabot_giveaways SET join_list = join_list || '"${user.id}"' WHERE giveaway_id = '${giveaway.giveaway_id}';
            `).catch(console.error)
        }).catch(console.error)
    }
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() && interaction.guild.id == guild_id && interaction.commandName == 'giveaways') {
        if (interaction.options.getSubcommand() == 'create') {
            const discord_id = interaction.user.id
            const item = interaction.options.getString('item')
            const rp_cost = interaction.options.getNumber('rp_cost')
            const winner_count = interaction.options.getNumber('winner_count')
            const expiry = interaction.options.getString('expiry')
            var expiration = 0
            expiry.split(' ').map(word => {
                if (word.match('d'))
                    expiration += 1000 * 60 * 60 * 24 * Number(word.replace('d',''))
                if (word.match('h'))
                    expiration += 1000 * 60 * 60 * Number(word.replace('h',''))
                if (word.match('m'))
                    expiration += 1000 * 60 * Number(word.replace('m',''))
            })
            if (!expiration) {
                return interaction.reply({
                    content: ' ',
                    embeds: [{
                        description: 'Expiry time could not be determined\nType **1d** for one day, **2h** for two hours, **10m** for ten minutes'
                    }],
                    ephemeral: true
                }).catch(console.error)
            }
            const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
            if (!channel) return
            channel.send({
                content: ' ',
                embeds: [{
                    title: convertUpper(item),
                    description: 'React with 🎉 to join',
                    fields: [{
                        name: 'Hosted By',
                        value: `<@${discord_id}>`,
                        inline: true
                    },{
                        name: 'RP Required to Join',
                        value: rp_cost.toString(),
                        inline: true
                    },{
                        name: 'Expires',
                        value: `<t:${Math.round(Number(new Date().getTime() + expiration) / 1000)}:R>`,
                        inline: true
                    },],
                    footer: {
                        text: `${winner_count || 1} Winner${winner_count > 1 ? 's':''} | 0 Entries\n\u200b`
                    },
                    color: 'RANDOM',
                    timestamp: new Date().getTime()
                }]
            }).then(msg => {
                db.query(`
                    INSERT INTO as_gabot_giveaways (
                        discord_id,
                        channel_id,
                        message_id,
                        item,
                        rp_cost,
                        winner_count,
                        expiry_timestamp
                    ) VALUES (
                        '${discord_id}',
                        '${msg.channel.id}',
                        '${msg.id}',
                        '${item}',
                        ${rp_cost},
                        ${winner_count || 1},
                        ${new Date().getTime() + expiration}
                    )
                `).then(res => {
                    if (res.rowCount == 1) {
                        interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: `Your giveaway **${convertUpper(item)}** has been hosted in channel <#${channel_id}>`
                            }],
                            ephemeral: true
                        }).catch(console.error)
                        msg.react('🎉').catch(console.error)
                    } else {
                        interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: `Some error occured in db, received rows ${res.rowCount}\nContact <@253525146923433984>`
                            }],
                            ephemeral: false
                        }).catch(console.error)
                        msg.delete().catch(console.error)
                    }
                }).catch(err => {
                    console.log(err)
                    interaction.reply({
                        content: ' ',
                        embeds: [{
                            description: `Some error occured in db: ${err.detail || err.stack || err}\nContact <@253525146923433984>`
                        }],
                        ephemeral: false
                    }).catch(console.error)
                    msg.delete().catch(console.error)
                })
            }).catch(console.error)
        }
    }
})

client.on('ready', async () => {
    update_users_list()
})

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
socket.on('tradebotUsersUpdated', (payload) => {
    console.log('[relicbot] tradebotUsersUpdated')
    update_users_list()
})


db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);
    
    if (notification.channel == 'as_gabot_giveaways_insert') {
        const giveaway = payload
        closeGiveaway(giveaway.giveaway_id, giveaway.expiry_timestamp)
    }

    if (notification.channel == 'as_gabot_giveaways_update') {
        const giveaway = payload[0]
        const old_giveaway = payload
        if (giveaway.status == 'closed' && old_giveaway.status == 'opened') {
            db.query(`
                SELECT * FROM as_gabot_messages WHERE giveaway_id = '${giveaway.giveaway_id}'
            `).then(async res => {
                if (!res.rows[0]) return
                const channel = client.channels.cache.get(res.rows[0].channel_id) || await client.channels.fetch(res.rows[0].channel_id).catch(console.error)
                if (!channel) return
                const message = channel.messages.cache.get(res.rows[0].message_id) || await channel.messages.fetch(res.rows[0].message_id).catch(console.error)
                if (!message) return
                message.edit({
                    content: ' ',
                    embeds: message.embeds.map(embed => {
                        embed.title = `~~${embed.title}~~ (Ended)`
                        embed.fields.push({
                            name: `Winner${giveaway.winners_list.length > 1 ? 's':''}`,
                            value: giveaway.winners_list.map(id => `<@${id}>`).join('\n'),
                            inline: true
                        })
                        return embed
                    })
                }).catch(console.error)
                channel.send({
                    content: ' ',
                    embeds: [{
                        title: 'Giveaway Ended',
                        description: `${giveaway.winners_list.map(id => `<@${id}>`).join(', ')} ${giveaway.winners_list.length > 1 ? 'have':'has'} won **${convertUpper(giveaway.item)}**`
                    }]
                }).catch(console.error)
            }).catch(console.error)
        }
    }
})

