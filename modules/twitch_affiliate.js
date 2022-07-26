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

async function interaction_handler(interaction) {
    try {
        if (interaction.isCommand()) {
            if (interaction.commandName == 'twitch_affiliate') {
                // check if authorized user
                if (authorized_userIds.includes(interaction.user.id)) {
                    // verify channel existence in db
                    ensureChannelExistence(interaction.channel.id).catch(err => {interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}).catch(err => console.log(err));console.log(err)})
                    .then(() => {
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
                            interaction.reply({content: `This server has now been affiliated with WarframeHub`,ephemeral: true}).catch(err => console.log(err))
                            updateAffiliations()
                        } else if (interaction.options.getSubcommand() == 'remove_server') {
                            removeChannelAffiliation(interaction.channel.id).catch(err => {interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}).catch(err => console.log(err));console.log(err)})
                            .then((res) => {
                                interaction.reply({content: `This server has been unaffiliated from WarframeHub`,ephemeral: true}).catch(err => console.log(err))
                                updateAffiliations()
                            })
                        }
                    })
                } else {
                    interaction.reply({content: 'Sorry, you are not authorized for this command'}).catch(err => console.log(err))
                }
            }
        }
    } catch(e) {
        console.log(e)
    }
}

async function addStreamer(username,custom_message) {
    return new Promise(async (resolve,reject) => {
        if (!custom_message) custom_message = ''
        const twitchUser = await twitchApiClient.users.getUserByName(username);
        if (!twitchUser) reject(`The streamer **${username}** does not exist`)
        db.query(`SELECT * FROM twitch_affiliate_streamers where username = '${username}'`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 1) resolve(`The streamer **${username}** has already been affiliated with WarframeHub`)
            else if (res.rowCount == 0) {
                db.query(`INSERT INTO twitch_affiliate_streamers (username,streamer_id,custom_message,time_added) VALUES ('${username}','${twitchUser.id}',NULLIF('${custom_message}', ''),${new Date().getTime()})`).catch(err => reject(err))
                .then(res => {
                    //send affiliation msg in every channel
                    db.query(`SELECT * FROM twitch_affiliate_channels`).catch(err => reject(err))
                    .then(async res => {
                        for (const [index,row] of res.rows.entries()) {
                            const webhookClient = new WebhookClient({url: row.webhook_url});
                            await webhookClient.send({
                                content: `Streamer: ${username} (details will be fetched and stuff)`
                            }).catch(err => reject(err))
                            .then(async res => {
                                await db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,time_added) VALUES ('${twitchUser.id}',${res.id},${row.channel_id},${new Date().getTime()})`).catch(err => reject(err))
                            })
                        }
                        resolve(`**${username}** has now been affiliated with WarframeHub`)
                    })
                })
            } else {
                reject('unexpected result querying db, contact developer with error code 502')
            }
        })
    })
}
async function removeStreamer(username) {
    return new Promise(async (resolve,reject) => {
        const twitchUser = await twitchApiClient.users.getUserByName(username);
        if (!twitchUser) reject(`The streamer **${username}** does not exist`)
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
            const twitchUser = await twitchApiClient.users.getUserById(streamer.streamer_id);
            if (twitchUser) {
                streamers_data[streamer.streamer_id] = {
                    username: twitchUser.name,
                    displayName: twitchUser.displayName,
                    description: twitchUser.description,
                    avatarUrl: twitchUser.profilePictureUrl
                }
                
            }
        }

        for (const [index,message] of messages.entries()) {
            const webhookClient = new WebhookClient({url: channels_data[message.channel_id].webhook_url});
            webhookClient.editMessage(message.message_id, {
                content: 'React with <emoji> to be notified when this streamer is live',
                embeds: [{
                    author: {
                        name: streamers_data[message.streamer_id].displayName,
                        url: `https://twitch.tv/${streamers_data[message.streamer_id].username}`,
                        icon_url: streamers_data[message.streamer_id].avatarUrl
                    },
                    description: streamers_data[message.streamer_id].description,
                }]
            }).catch(err => console.log(err))
        }
    } catch(e) {
        console.log(e)
    }
}

async function removeChannelAffiliation(channelId) {
    return new Promise((resolve,reject) => {
        db.query(`DELETE FROM twitch_affiliate_channels WHERE channel_id = ${channelId} RETURNING *`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 1) {
                const webhookClient = new WebhookClient({url: res.rows[0].webhook_url});
                webhookClient.delete().catch(err => console.log(err))
                client.channels.fetch(channelId).catch(err => console.log(err))
                .then(channel => {
                    channel.messages.fetch({limit: 100}).catch(err => console.log(err))
                    .then(messages => {
                        messages.forEach(msg => msg.delete().catch(err => console.log(err)))
                    })
                })
                resolve()
            }
            else {
                reject('unexpected result querying db, contact developer with error code 504')
            }
        })
    })
}

async function ensureChannelExistence(channelId) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM twitch_affiliate_channels WHERE channel_id = ${channelId}`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 1) resolve()
            else if (res.rowCount == 0) {
                client.channels.fetch(channelId).catch(err => reject(err))
                .then(channel => {
                    channel.createWebhook('Twitch Affiliates (WarframeHub)',{avatar: 'https://cdn.discordapp.com/attachments/864199722676125757/1001563100438331453/purple-twitch-logo-png-18.png'}).catch(err => reject(err))
                    .then(webhookClient => {
                        db.query(`INSERT INTO twitch_affiliate_channels (channel_id,webhook_url,time_added) VALUES (${channelId},'${webhookClient.url}',${new Date().getTime()})`).catch(err => reject(err))
                        .then(res => {
                            firstTimeAddServer(channelId,webhookClient).catch(err => reject(err))
                            .then(() => resolve())
                        })
                    })
                })
            } else {
                reject('unexpected result querying db, contact developer with error code 501')
            }
        })
        resolve('yes')
    })
}


async function firstTimeAddServer(channelId,webhookClient) {
    return new Promise((resolve,reject) => {
        // send all existing streamers messages
        db.query(`SELECT * FROM twitch_affiliate_streamers`).catch(err => reject(err))
        .then(async res => {
            for (const [index,row] of res.rows.entries()) {
                await webhookClient.send({
                    content: `Streamer: ${row.username} (details will be fetched and stuff)`
                }).catch(err => reject(err))
                .then(async res => {
                    await db.query(`INSERT INTO twitch_affiliate_messages (streamer_id,message_id,channel_id,time_added) VALUES ('${row.streamer_id}',${res.id},${channelId},${new Date().getTime()})`).catch(err => reject(err))
                })
            }
        })
        resolve()
    })
}

function usernameValidate(str) {
    return str.replace(/-/g,'')
}

module.exports = {
    interaction_handler,
    bot_initialize
}