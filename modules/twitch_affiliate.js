const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');
const {ClientCredentialsAuthProvider} = require('@twurple/auth')
const {ApiClient} = require('@twurple/api')

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
                        interaction.reply({content: 'test_add'}).catch(err => console.log(err))
                    } else if (interaction.options.getSubcommand() == 'remove') {
                        interaction.reply({content: 'test_remove'}).catch(err => console.log(err))
                    }
                })
            } else {
                interaction.reply({content: 'Sorry, you are not authorized for this command'}).catch(err => console.log(err))
            }
        }
    }
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
                        .then(res => resolve())
                    })
                })
            } else {
                reject('unexpected result querying db, contact developer withe error code 501')
            }
        })
        resolve('yes')
    })
}

module.exports = {
    interaction_handler
}