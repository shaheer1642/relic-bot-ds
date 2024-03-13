const { client } = require('./discord_client');
const { db } = require('./db_connection')
const uuid = require('uuid')
const { WebhookClient } = require('discord.js');
const JSONbig = require('json-bigint');
const { socket } = require('./socket')
const { inform_dc, dynamicSort, dynamicSortDesc, msToTime, msToFullTime, embedScore, convertUpper } = require('./extras.js');
const { as_users_list, as_users_list_discord } = require('./allsquads/as_users_list')

const guild_id = '865904902941048862'
const channel_id = '890198895508992020'

const getShuffledArr = arr => {
    const newArr = arr.slice()
    for (let i = newArr.length - 1; i > 0; i--) {
        const rand = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[rand]] = [newArr[rand], newArr[i]];
    }
    return newArr
};

function closeGiveaway(giveawayObj) {
    setTimeout(() => {
        db.query(`
            SELECT * FROM as_gabot_giveaways WHERE giveaway_id='${giveawayObj.giveaway_id}' AND status = 'active';
        `).then(res => {
            const giveaway = res.rows[0]
            if (!giveaway) return
            var winners_list = []
            giveaway.join_list = getShuffledArr(giveaway.join_list);
            while (giveaway.winner_count != 0) {
                winners_list.push(giveaway.join_list.pop())
                giveaway.winner_count--
            }
            winners_list = winners_list.filter(o => o != undefined)
            db.query(`
                UPDATE as_gabot_giveaways SET winners_list = '${JSON.stringify(winners_list)}', status = 'ended' WHERE giveaway_id='${giveawayObj.giveaway_id}' AND status = 'active';
            `).catch(console.error)
        }).catch(console.error)
    }, giveawayObj.expiry_timestamp - new Date().getTime());
}

function rerollGiveaway(giveaway_id) {
    return new Promise((resolve, reject) => {
        db.query(`
            SELECT * FROM as_gabot_giveaways WHERE giveaway_id='${giveaway_id}' AND status = 'ended';
        `).then(res => {
            const giveaway = res.rows[0]
            if (!giveaway) return resolve('Could not find that giveaway')
            var winners_list = giveaway.winners_list
            var join_list = giveaway.join_list.filter(id => !winners_list.includes(id))
            if (join_list.length == 0) return resolve('This giveaway cannot be rerolled anymore')
            join_list = getShuffledArr(join_list);
            winners_list.push(join_list.pop())
            db.query(`
                UPDATE as_gabot_giveaways SET winners_list = '${JSON.stringify(winners_list)}' WHERE giveaway_id='${giveaway_id}' AND status = 'ended';
            `).then(res => {
                if (res.rowCount != 1) return resolve('unexpected db response')
                else return resolve('giveaway rerolled!')
            }).catch(console.error)
        }).catch(console.error)
    })
}

client.on('messageDelete', async (message) => {
    if (message.channel.id == channel_id) {
        db.query(`
            UPDATE as_gabot_giveaways SET status = 'cancelled' WHERE message_id='${message.id}' AND status = 'active';
        `).catch(console.error)
    }
})

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand() && interaction.guild.id == guild_id && interaction.commandName == 'giveaways') {
        if (interaction.options.getSubcommand() == 'create') {
            const user = as_users_list_discord[interaction.user.id]
            if (!user) {
                return interaction.reply({
                    content: 'Your account is not verified',
                    ephemeral: true
                }).catch(console.error)
            }
            db.query(`SELECT * FROM as_gabot_giveaways WHERE user_id = '${user.user_id}' AND creation_timestamp > ${new Date().getTime() - 86400000} AND status = 'active'`).then(async res => {
                if (res.rowCount != 0 && interaction.user.id != '253525146923433984') {
                    return interaction.reply({
                        content: `You have already hosted a giveaway today. You may host again in **${msToFullTime((Number(res.rows[0].creation_timestamp) + 86400000) - new Date().getTime())}**`,
                        ephemeral: true
                    }).catch(console.error)
                } else {
                    const item = interaction.options.getString('item').replace(/'/g, `''`)
                    const rp_cost = interaction.options.getNumber('rp_cost')
                    const winner_count = interaction.options.getNumber('winner_count')
                    const expiry = interaction.options.getString('expiry')
                    var expiration = 0
                    expiry.split(' ').map(word => {
                        if (word.match('d'))
                            expiration += 1000 * 60 * 60 * 24 * Number(word.replace('d', ''))
                        if (word.match('h'))
                            expiration += 1000 * 60 * 60 * Number(word.replace('h', ''))
                        if (word.match('m'))
                            expiration += 1000 * 60 * Number(word.replace('m', ''))
                    })
                    if (!expiration) {
                        return interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: 'Expiry time could not be determined\nType **3d** for three days, **2h** for two hours, **10m** for ten minutes'
                            }],
                            ephemeral: true
                        }).catch(console.error)
                    }
                    if (expiration < 259200000) {
                        return interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: 'Minimum expiry time should be 3 days'
                            }],
                            ephemeral: true
                        }).catch(console.error)
                    }
                    if (item.length > 100) {
                        return interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: 'Item name is too long. Must be within 1 - 100 characters'
                            }],
                            ephemeral: true
                        }).catch(console.error)
                    }
                    if (rp_cost < 5) {
                        return interaction.reply({
                            content: ' ',
                            embeds: [{
                                description: 'Minimum RP value should 5'
                            }],
                            ephemeral: true
                        }).catch(console.error)
                    }
                    const channel = client.channels.cache.get(channel_id) || await client.channels.fetch(channel_id).catch(console.error)
                    if (!channel) return
                    channel.send({
                        content: ' ',
                        embeds: [{
                            title: `[${user.platform}] ${convertUpper(item)}`,
                            description: `Click 🎉 to join\n${winner_count || 1} Winner${winner_count > 1 ? 's' : ''} | 0 Entries`,
                            fields: [{
                                name: 'Hosted By',
                                value: `<@${user.discord_id}>`,
                                inline: true
                            }, {
                                name: 'RP Required to Join',
                                value: rp_cost.toString(),
                                inline: true
                            }, {
                                name: 'Ends',
                                value: `<t:${Math.round(Number(new Date().getTime() + expiration) / 1000)}:R>`,
                                inline: true
                            },],
                            color: 'RANDOM',
                            timestamp: new Date().getTime()
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 2,
                                label: '0',
                                emoji: '🎉',
                                style: 3,
                                custom_id: 'as_ga_join'
                            }]
                        }],
                    }).then(msg => {
                        msg.pin().catch(console.error)
                        db.query(`
                            INSERT INTO as_gabot_giveaways (
                                user_id,
                                channel_id,
                                message_id,
                                item,
                                rp_cost,
                                winner_count,
                                expiry_timestamp
                            ) VALUES (
                                '${user.user_id}',
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
                                        description: `Your giveaway **${convertUpper(item)}** has been hosted in <#${channel_id}> channel`
                                    }],
                                    ephemeral: true
                                }).catch(console.error)
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
            }).catch(console.error)
        } else if (interaction.options.getSubcommand() == 'reroll') {
            rerollGiveaway(interaction.options.getString('giveaway')).then(res => {
                interaction.reply({
                    content: res,
                    ephemeral: true
                }).catch(console.error)
            }).catch(console.error)
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId == 'as_ga_join') {
            const user = as_users_list_discord[interaction.user.id]
            if (!user) {
                return interaction.reply({
                    content: 'Your account is not verified',
                    ephemeral: true
                }).catch(console.error)
            }
            if (user.is_suspended) {
                return interaction.reply({
                    content: 'You are suspended from using this feature',
                    ephemeral: true
                }).catch(console.error)
            }
            db.query(`
                SELECT * FROM as_gabot_giveaways WHERE message_id = '${interaction.message.id}';
                SELECT * FROM as_users_list WHERE user_id = '${user.user_id}';
            `).then(res => {
                const giveaway = res[0].rows[0]
                const user_account = res[1].rows[0]
                if (!giveaway) return interaction.reply({ content: 'Some error occured. Please contact an admin or MrSofty#7012', ephemeral: true }).catch(console.error)
                if (giveaway.status != 'active') return interaction.reply({ content: 'Giveaway is not active', ephemeral: true }).catch(console.error)
                if (giveaway.join_list.includes(user.user_id)) {
                    return interaction.reply({
                        content: `You have already joined this giveaway`,
                        ephemeral: true
                    }).catch(console.error)
                }
                if (giveaway.user_id == user.user_id) {
                    return interaction.reply({
                        content: `Cannot join your own giveaway`,
                        ephemeral: true
                    }).catch(console.error)
                }
                if (as_users_list[giveaway.user_id].platform != user.platform) {
                    return interaction.reply({
                        content: `Cannot join giveaway on another platform yet`,
                        ephemeral: true
                    }).catch(console.error)
                }
                if (giveaway.rp_cost > 0) {
                    if (user_account.balance < giveaway.rp_cost) {
                        return interaction.reply({
                            content: `You do not have enough RP to join this giveaway\nCurrent RP: ${user_account.balance}\nCheck <#1050484747735924736> on how to earn RP`,
                            ephemeral: true
                        }).catch(console.error)
                    }
                }
                db.query(`
                    INSERT INTO challenges_transactions
                    (transaction_id,user_id,type,rp,balance_type,timestamp, guild_id)
                    VALUES ('${uuid.v4()}','${user.user_id}','giveaway_join',${giveaway.rp_cost},'debit',${new Date().getTime()},'${interaction.message.guild.id}');
                    UPDATE as_gabot_giveaways SET join_list = join_list || '"${user.user_id}"' WHERE giveaway_id = '${giveaway.giveaway_id}';
                `).catch(console.error)
                interaction.deferUpdate().catch(console.error)
            }).catch(console.error)
        }
    }
    if (interaction.isAutocomplete()) {
        if (interaction.commandName == 'giveaways') {
            if (interaction.options.getSubcommand() == 'reroll') {
                const user = as_users_list_discord[interaction.user.id]
                if (!user) return
                db.query(`SELECT * FROM as_gabot_giveaways WHERE LOWER(item) LIKE '%${interaction.options.getString('giveaway')}%' AND user_id = '${user.user_id}' AND status = 'ended' AND expiry_timestamp > ${new Date().getTime() - 1209600000}`)
                    .then(res => {
                        interaction.respond(res.rows.map(row => ({
                            name: row.item,
                            value: row.giveaway_id
                        }))).catch(err => console.log(err))
                    }).catch(err => console.log(err))
            }
        }
    }
})

client.on('ready', async () => {
    db.query(`
        SELECT * FROM as_gabot_giveaways WHERE status = 'active';
    `).then(res => {
        res.rows.forEach(giveaway => closeGiveaway(giveaway))
    }).catch(console.error)
})

function embedGenerator(giveaway) {
    return {
        content: ' ',
        embeds: [{
            title: `[${as_users_list[giveaway.user_id]?.platform}] ${convertUpper(giveaway.item)}`,
            description: `Click 🎉 to join\n${giveaway.winner_count || 1} Winner${giveaway.winner_count > 1 ? 's' : ''} | ${giveaway.join_list.length} Entr${giveaway.join_list.length > 1 ? 'ies' : 'y'}`,
            fields: [{
                name: 'Hosted By',
                value: `<@${as_users_list[giveaway.user_id]?.discord_id}>`,
                inline: true
            }, {
                name: 'RP Required to Join',
                value: giveaway.rp_cost.toString(),
                inline: true
            }, {
                name: 'Ends',
                value: `<t:${Math.round(giveaway.expiry_timestamp / 1000)}:R>`,
                inline: true
            },],
            color: 'RANDOM',
            timestamp: new Date().getTime()
        }],
        components: [{
            type: 1,
            components: [{
                type: 2,
                label: giveaway.join_list.length,
                emoji: '🎉',
                style: 3,
                custom_id: 'as_ga_join'
            }]
        }],
    }
}

db.on('notification', async (notification) => {
    const payload = JSONbig.parse(notification.payload);

    if (notification.channel == 'as_gabot_giveaways_insert') {
        const giveaway = payload
        closeGiveaway(giveaway)
    }

    if (notification.channel == 'as_gabot_giveaways_update') {
        const giveaway = payload[0]
        const old_giveaway = payload[1]
        const channel = client.channels.cache.get(giveaway.channel_id) || await client.channels.fetch(giveaway.channel_id).catch(console.error)
        if (!channel) return
        const message = channel.messages.cache.get(giveaway.message_id) || await channel.messages.fetch(giveaway.message_id).catch(console.error)
        //if (!message) return
        if (old_giveaway.status == 'active' && giveaway.status == 'ended') {
            if (message) message.delete().catch(console.error)
            // message.edit({
            //     content: ' ',
            //     embeds: message.embeds.map(embed => {
            //         embed.title = `~~${embed.title}~~ (Ended)`
            //         embed.fields.push({
            //             name: `Winner${giveaway.winners_list.length > 1 ? 's':''}`,
            //             value: giveaway.winners_list.length == 0 ? 'Not enough entries' : giveaway.winners_list.map(id => `<@${id}>`).join('\n'),
            //             inline: false
            //         })
            //         embed.fields = embed.fields.filter(o => o.name != 'Expires')
            //         return embed
            //     })
            // }).catch(console.error)
            channel.send({
                content: giveaway.winners_list.length == 0 ? `**Giveaway Ended: ${convertUpper(giveaway.item)}**\n*Not enough entries*` : `**Giveaway Ended**\n${giveaway.winners_list.map(id => `<@${as_users_list[id].discord_id}>`).join(', ')} ${giveaway.winners_list.length > 1 ? 'have' : 'has'} won **${convertUpper(giveaway.item)}** giveaway by <@${as_users_list[giveaway.user_id].discord_id}>`,
            }).catch(console.error)
        } else if (giveaway.status == 'ended' && old_giveaway.status == 'ended' && old_giveaway.winners_list.length != giveaway.winners_list.length) {
            channel.send({
                content: `***Giveaway Rerolled***\n${`<@${as_users_list[giveaway.winners_list.pop()].discord_id}>`} has won **${convertUpper(giveaway.item)}** giveaway by <@${as_users_list[giveaway.user_id].discord_id}>`,
            }).catch(console.error)
        } else if (giveaway.status == 'active') {
            message.edit(embedGenerator(giveaway)).catch(console.error)
        }
    }
})

