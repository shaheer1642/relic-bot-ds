const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

const {ClientCredentialsAuthProvider} = require('@twurple/auth')
const {ApiClient} = require('@twurple/api');

const { WebhookClient } = require('discord.js');

const authProvider = new ClientCredentialsAuthProvider(process.env.twitch_clientId, process.env.twitch_clientSecret);
const twitchApiClient = new ApiClient({ authProvider });

const authorized_userIds = ['253525146923433984','253980061969940481']


function bot_initialize() {
    updateAffiliations()
    
    setInterval(() => {
        updateAffiliations()
    }, 60000);
}

const emotes = {
    notify: {
        string: '<:follow_twitch:1001860010877399182>',
        identifier: 'follow_twitch:1001860010877399182'
    }
}

async function interaction_handler(interaction) {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName == 'twitch_affiliate') {
                // check if authorized user
                if (authorized_userIds.includes(interaction.user.id)) {
                    // verify channel existence in db
                    if (interaction.options.getSubcommand() == 'add_streamer') {
                        addStreamer(usernameValidate(interaction.options.getString('username')),interaction.options.getString('custom_message') || '').catch(err => {interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`});console.log(err)})
                        .then((res) => {
                            interaction.reply({content: typeof res == 'string' ? res:JSON.stringify(res),ephemeral: true}).catch(err => console.log(err))
                            updateAffiliations()
                        })
                        
                    } else if (interaction.options.getSubcommand() == 'remove_streamer') {
                        removeStreamer(usernameValidate(interaction.options.getString('username'))).catch(err => {interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}).catch(err => console.log(err));console.log(err)})
                        .then((res) => {
                            interaction.reply({content: typeof res == 'string' ? res:JSON.stringify(res),ephemeral: true}).catch(err => console.log(err))
                            updateAffiliations()
                        })
                    } else if (interaction.options.getSubcommand() == 'add_server') {
                        await interaction.deferReply().catch(err => console.log(err))
                        addServerAffiliation(interaction.guild.id).then(res => {
                            interaction.editReply({content: res,ephemeral: true}).catch(err => console.log(err))
                        }).catch(err => {
                            interaction.editReply({content: `Sorry, some error occured\n${err}`,ephemeral: false}).catch(err => console.log(err))
                        })
                        updateAffiliations()
                    } else if (interaction.options.getSubcommand() == 'remove_server') {
                        await interaction.deferReply().catch(err => console.log(err))
                        removeServerAffiliation(interaction.guild.id).then(res => {
                            interaction.editReply({content: res,ephemeral: true}).catch(err => console.log(err))
                        }).catch(err => {
                            interaction.editReply({content: `Sorry, some error occured\n${err}`,ephemeral: false}).catch(err => console.log(err))
                        })
                        updateAffiliations()
                    }
                } else {
                    interaction.reply({content: 'Sorry, you are not authorized for this command'}).catch(err => console.log(err))
                }
            }
        }
    } catch(e) {
        console.log(e)
    }
}

async function reaction_handler(reaction, user, action) {
    if (action == 'add') {
        db.query(`
            UPDATE twitch_affiliate_messages
            SET notify = jsonb_set(notify, '{user_ids,999999}', '"${user.id}"', true)
            WHERE message_id = ${reaction.message.id};
        `).catch(err => console.log(err))
    } else if (action == 'remove') {
        db.query(`
            UPDATE twitch_affiliate_messages
            SET notify = jsonb_set(notify, '{user_ids}', (notify->'user_ids') - '${user.id}')
            WHERE message_id = ${reaction.message.id};
        `).catch(err => console.log(err))
    }
}

async function addStreamer(username,custom_message) {
    return new Promise(async (resolve,reject) => {
        if (!custom_message) custom_message = ''
        twitchApiClient.users.getUserByName(username).catch(err => reject(err))
        .then(twitchUser => {
            if (!twitchUser) {
                resolve(`The streamer **${username}** does not exist`)
                return
            }
            db.query(`SELECT * FROM twitch_affiliate_streamers where username = '${username}'`).catch(err => reject(err))
            .then(res => {
                if (res.rowCount == 1) resolve(`The streamer **${username}** has already been affiliated with WarframeHub`)
                else if (res.rowCount == 0) {
                    db.query(`INSERT INTO twitch_affiliate_streamers (username,streamer_id,custom_message,time_added) VALUES ('${username}','${twitchUser.id}',NULLIF('${custom_message}', ''),${new Date().getTime()})`).catch(err => reject(err))
                    .then(res => {
                        //send affiliation msg in sub channels
                        db.query(`SELECT * FROM twitch_affiliate_channels WHERE channel_type='affiliate_channel'`).catch(err => reject(err))
                        .then(async res => {
                            for (const [index,row] of res.rows.entries()) {
                                const webhookClient = new WebhookClient({url: row.webhook_url});
                                await webhookClient.send({
                                    content: `Streamer: ${username} (fetching details...)`
                                }).catch(err => reject(err))
                                .then(async res => {
                                    client.channels.cache.get(res.channel_id).messages.fetch(res.id).then(msg => msg.react(emotes.notify.string).catch(err => console.log(err))).catch(err => console.log(err))
                                    await db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,message_type,time_added) VALUES ('${twitchUser.id}',${res.id},${row.channel_id},'affiliate_message',${new Date().getTime()})`).catch(err => reject(err))
                                })
                            }
                            resolve(`**${username}** has now been affiliated with WarframeHub`)
                        })
                    })
                } else {
                    reject('unexpected result querying db, contact developer with error code 502')
                }
            })
        });
    })
}
async function removeStreamer(username) {
    return new Promise(async (resolve,reject) => {
        twitchApiClient.users.getUserByName(username).catch(err => reject(err))
        .then(twitchUser => {
            if (!twitchUser) {
                resolve(`The streamer **${username}** does not exist`)
                return
            }
            db.query(`SELECT * FROM twitch_affiliate_streamers WHERE streamer_id = '${twitchUser.id}'`).catch(err => reject(err))
            .then(res => {
                if (res.rowCount == 0) resolve(`The streamer **${username}** was never affiliated with WarframeHub`)
                else if (res.rowCount == 1) {
                    db.query(`SELECT * FROM twitch_affiliate_messages WHERE streamer_id = '${twitchUser.id}'`).catch(err => reject(err))
                    .then(res => {
                        const messages = res.rows
                        db.query(`DELETE FROM twitch_affiliate_streamers WHERE streamer_id = '${twitchUser.id}'`).catch(err => reject(err))
                        .then(() => {
                            messages.forEach(message => {
                                client.channels.cache.get(message.channel_id).messages.fetch(message.message_id).then(msg => msg.delete().catch(err => console.log(err))).catch(err => console.log(err))
                            })
                            resolve(`**${username}** has been unaffiliated from WarframeHub`)
                        })
                    })
                } else {
                    reject('unexpected result querying db, contact developer with error code 503')
                }
            })
        });
    })
}

async function updateAffiliations() {
    try {
        const streamers = await db.query(`SELECT * FROM twitch_affiliate_streamers`).catch(err => console.log(err))
        .then(res => {
            return res.rows
        })
        const channels = await db.query(`SELECT * FROM twitch_affiliate_channels`).catch(err => console.log(err))
        .then(res => {
            return res.rows
        })
        const messages = await db.query(`SELECT * FROM twitch_affiliate_messages`).catch(err => console.log(err))
        .then(res => {
            return res.rows
        })

        var channels_data = {}
        channels.forEach(channel => channels_data[channel.channel_id] = channel)

        var streamers_data = {}
        for (const [index,streamer] of streamers.entries()) {
            const twitchUser = await twitchApiClient.users.getUserById(streamer.streamer_id).catch(err => console.log(err));
            if (twitchUser) {
                streamers_data[streamer.streamer_id] = {
                    username: twitchUser.name,
                    displayName: twitchUser.displayName,
                    description: twitchUser.description,
                    avatarUrl: twitchUser.profilePictureUrl,
                    stream: {},
                    old_stream_status: streamer.status
                }
            }
            
            await twitchUser.getStream().catch(err => console.log(err)).then(stream => {
                if (stream) {
                    streamers_data[streamer.streamer_id].stream = {
                        status: 'live',
                        startedAt: new Date(stream.startDate).getTime(),
                        playing: stream.gameName == '' ? '\u200b':stream.gameName,
                        viewCount: stream.viewers == '' ? '\u200b':stream.viewers.toString(),
                        lang: stream.language == '' ? '\u200b':stream.language,
                        title: stream.title,
                        thumbnail: stream.thumbnailUrl.replace('-{width}x{height}','')
                    }
                } else {
                    streamers_data[streamer.streamer_id].stream = {
                        status: 'offline'
                    }
                }
            })
        }

        //console.log(JSON.stringify(streamers_data))

        var db_query = ''
        Object.keys(streamers_data).forEach(async streamer_id => {
            db_query += `UPDATE twitch_affiliate_streamers SET status='${streamers_data[streamer_id].stream.status}' WHERE streamer_id = '${streamer_id}';`
        })

        await db.query(db_query).catch(err => console.log(err))

        for (const [index,message] of messages.entries()) {
            const webhookClient = new WebhookClient({url: channels_data[message.channel_id].webhook_url});

            var embeds = []
            embeds.push({
                title: streamers_data[message.streamer_id].displayName + (streamers_data[message.streamer_id].stream.status == 'live' ? ' 🔴':''),
                url: `https://twitch.tv/${streamers_data[message.streamer_id].username}`,
                thumbnail: {
                    url: streamers_data[message.streamer_id].avatarUrl
                },
                description: streamers_data[message.streamer_id].description + `\n\nUser is currently ${streamers_data[message.streamer_id].stream.status}`,
                color: streamers_data[message.streamer_id].stream.status == 'live' ? '#ff0000':'#9511d6'
            })

            if (streamers_data[message.streamer_id].stream.status == 'live') {
                embeds.push({
                    description: `[${streamers_data[message.streamer_id].stream.title}](https://twitch.tv/${streamers_data[message.streamer_id].username})`,
                    fields: [{
                        name: 'Stream started', value: `<t:${Math.round(streamers_data[message.streamer_id].stream.startedAt / 1000)}:R>`, inline: true
                    }, {
                        name: 'Playing', value: streamers_data[message.streamer_id].stream.playing, inline: true
                    },{
                        name: '\u200b', value: '\u200b', inline: true
                    },{
                        name: 'Viewers', value: streamers_data[message.streamer_id].stream.viewCount, inline: true
                    },{
                        name: 'Language', value: streamers_data[message.streamer_id].stream.lang, inline: true
                    },{
                        name: '\u200b', value: '\u200b', inline: true
                    },],
                    image: {url: streamers_data[message.streamer_id].stream.thumbnail},
                    color: '#ff0000'
                })
            }

            webhookClient.editMessage(message.message_id, {
                content: `React with ${emotes.notify.string} to be notified when this streamer is live`,
                embeds: embeds
            }).catch(err => console.log(err))
            // notify that user is live
            if (streamers_data[message.streamer_id].stream.status != streamers_data[message.streamer_id].old_stream_status) {
                if (streamers_data[message.streamer_id].stream.status == 'live') {
                    if (message.notify.user_ids.length > 0) {
                        webhookClient.send(`**${streamers_data[message.streamer_id].displayName}** is live!\n${message.notify.user_ids.map(userId => `<@${userId}>`).join(', ')}`)
                        .then(msg => {
                            setTimeout(() => {
                                webhookClient.deleteMessage(msg.id).catch(err => console.log(err))
                            }, 10000);
                        })
                        .catch(err => console.log(err))
                    }
                }
            }
        }
    } catch(e) {
        console.log(e)
    }
}

async function removeServerAffiliation(guildId) {
    return new Promise((resolve,reject) => {
        db.query(`DELETE FROM twitch_affiliate_channels WHERE guild_id = ${guildId} RETURNING *`).catch(err => reject(err))
        .then(async res => {
            if (res.rowCount == 2) {
                for (const [index,row] of res.rows.entries()) {
                    await client.channels.fetch(row.channel_id).then(async (channel) => {
                        if (channel.parent)
                            await channel.parent.delete().catch(err => console.log(err))
                        await channel.delete().catch(err => console.log(err))
                    })
                }
                resolve('The server is has been unaffiliated from WarframeHub')
            } else if (res.rowCount == 0) {
                resolve('The server is currently not in affiliation with WarframeHub')
            } else {
                reject('Unexpected result querying db, contact developer with error code 504')
            }
        })
    })
}

async function addServerAffiliation(guildId) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM twitch_affiliate_channels WHERE guild_id=${guildId}`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 2) resolve('This server has already been affiliated with WarframeHub')
            else if (res.rowCount == 0) {
                client.guilds.fetch(guildId).catch(err => reject(err))
                .then(guild => {
                    guild.channels.create('Twitch Affiliates',{
                        type: 'GUILD_CATEGORY',
                    }).catch(err => reject(err)).then(category => { 
                        guild.channels.create('•📺•streamer-on-live',{
                            type: 'GUILD_TEXT',
                        }).catch(err => reject(err)).then(streamerlive => {
                            guild.channels.create('•🎙•streamer-affiliates',{
                                type: 'GUILD_TEXT',
                            }).catch(err => reject(err)).then(streameraff => {
                                streamerlive.setParent(category).catch(err => reject(err))
                                streameraff.setParent(category).catch(err => reject(err))
                                streamerlive.createWebhook('Twitch Affiliates (WarframeHub)',{avatar: 'https://cdn.discordapp.com/attachments/864199722676125757/1001563100438331453/purple-twitch-logo-png-18.png'}).catch(err => reject(err))
                                .then(streamerliveWebhook => {
                                    streameraff.createWebhook('Twitch Affiliates (WarframeHub)',{avatar: 'https://cdn.discordapp.com/attachments/864199722676125757/1001563100438331453/purple-twitch-logo-png-18.png'}).catch(err => reject(err))
                                    .then(streameraffWebhook => {
                                        db.query(`
                                            INSERT INTO twitch_affiliate_channels (channel_id,webhook_url,guild_id,channel_type,time_added) VALUES (${streamerlive.id},'${streamerliveWebhook.url}',${guildId},'live_channel',${new Date().getTime()});
                                            INSERT INTO twitch_affiliate_channels (channel_id,webhook_url,guild_id,channel_type,time_added) VALUES (${streameraff.id},'${streameraffWebhook.url}',${guildId},'affiliate_channel',${new Date().getTime()});
                                        `).catch(err => reject(err))
                                        .then(res => {
                                            // send all existing streamers messages
                                            db.query(`SELECT * FROM twitch_affiliate_streamers`).catch(err => reject(err))
                                            .then(async res => {
                                                for (const [index,row] of res.rows.entries()) {
                                                    await streameraffWebhook.send({
                                                        content: `Streamer: ${row.username} (fetching details...)`
                                                    }).catch(err => reject(err))
                                                    .then(async res => {
                                                        streameraff.messages.fetch(res.id).then(msg => msg.react(emotes.notify.string).catch(err => console.log(err))).catch(err => console.log(err))
                                                        await db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,message_type,time_added) VALUES ('${row.streamer_id}',${res.id},${streameraff.id},'affiliate_message',${new Date().getTime()})`).catch(err => reject(err))
                                                    })
                                                }
                                                await streamerliveWebhook.send({
                                                    content: `Streamers currently live are shown here`
                                                }).catch(err => reject(err))
                                                resolve(`This server has now been affiliated with WarframeHub. View affiliates in <#${streameraff.id}>`)
                                            })
                                        })
                                    })
                                })
                            })
                        })
                        
                    })
                })
            } else reject('Unexpected result querying db, please contact developer')
        })
    })
}

function usernameValidate(str) {
    return str.replace(/-/g,'').toLowerCase()
}

module.exports = {
    interaction_handler,
    bot_initialize,
    reaction_handler,
    emotes
}