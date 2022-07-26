const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {ClientCredentialsAuthProvider} = require('@twurple/auth')
const {ApiClient} = require('@twurple/api');
const { WebhookClient } = require('discord.js');

const authProvider = new ClientCredentialsAuthProvider(process.env.twitch_clientId, process.env.twitch_clientSecret);
const apiClient = new ApiClient({ authProvider });

const authorized_userIds = ['253525146923433984']

async function interaction_handler(interaction) {
    if (interaction.isCommand()) {
        if (interaction.commandName == 'twitch_affiliate') {
            // check if authorized user
            if (authorized_userIds.includes(interaction.user.id)) {
                // verify channel existence in db
                ensureChannelExistence(interaction.channel.id).catch(err => interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}))
                .then(() => {
                    if (interaction.options.getSubcommand() == 'add') {
                        addStreamer(interaction.options.getString('username')).catch(err => interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}))
                        .then((res) => {
                            interaction.reply({content: typeof res == 'string' ? res:JSON.stringify(res)}).catch(err => console.log(err))
                            updateAffiliations()
                        })
                        
                    } else if (interaction.options.getSubcommand() == 'remove') {
                        removeStreamer(interaction.options.getString('username')).catch(err => interaction.reply({content: `Sorry, some error occured.\n${JSON.stringify(err)}`}))
                        .then((res) => {
                            interaction.reply({content: typeof res == 'string' ? res:JSON.stringify(res)}).catch(err => console.log(err))
                            updateAffiliations()
                        })
                    }
                })
            } else {
                interaction.reply({content: 'Sorry, you are not authorized for this command'}).catch(err => console.log(err))
            }
        }
    }
}

async function addStreamer(username) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM twitch_affiliate_streamers where username = '${username}'`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 1) resolve(`The streamer **${username}** has already been affiliated with WarframeHub`)
            else if (res.rowCount == 0) {
                db.query(`INSERT INTO twitch_affiliate_streamers (username,time_added) VALUES ('${username}',${new Date().getTime()})`).catch(err => reject(err))
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
                                await db.query(`INSERT INTO twitch_affiliate_messages (username,message_id,channel_id,time_added) VALUES ('${username}',${res.id},${row.channel_id},${new Date().getTime()})`).catch(err => reject(err))
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
    return new Promise((resolve,reject) => {
        resolve('not implemented yet')
    })
}
async function updateAffiliations() {

}

async function ensureChannelExistence(channelId) {
    return new Promise((resolve,reject) => {
        db.query(`SELECT * FROM twitch_affiliate_channels where channel_id = ${channelId}`).catch(err => reject(err))
        .then(res => {
            if (res.rowCount == 1) resolve()
            else if (res.rowCount == 0) {
                client.channels.fetch(channelId).catch(err => reject(err))
                .then(channel => {
                    channel.createWebhook('Twitch Affiliates (WarframeHub)',{avatar: 'https://cdn.discordapp.com/attachments/864199722676125757/1001563100438331453/purple-twitch-logo-png-18.png'}).catch(err => reject(err))
                    .then(webhook => {
                        db.query(`INSERT INTO twitch_affiliate_channels (channel_id,webhook_url,time_added) VALUES (${channelId},'${webhook.url}',${new Date().getTime()})`).catch(err => reject(err))
                        .then(res => {
                            firstTimeAdd(channelId,webhook).catch(err => reject(err))
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


async function firstTimeAdd(channelId,webhook) {
    return new Promise((resolve,reject) => {
        resolve()
    })
}

module.exports = {
    interaction_handler
}