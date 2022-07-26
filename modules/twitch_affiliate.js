const {db} = require('./db_connection.js');
const {client} = require('./discord_client.js');

const {ClientCredentialsAuthProvider} = require('@twurple/auth')
const {ApiClient} = require('@twurple/api')
const {DirectConnectionAdapter, EventSubListener} = require('@twurple/eventsub')

const authProvider = new ClientCredentialsAuthProvider(process.env.twitch_clientId, process.env.twitch_clientSecret);
const apiClient = new ApiClient({ authProvider });

const authorized_userIds = ['253525146923433984']

async function interaction_handler(interaction) {
    if (interaction.isCommand()) {
        if (interaction.commandName == 'twitch_affiliate') {
            // check if authorized user
            if (authorized_userIds.includes(interaction.user.id)) {
                // verify channel existence in db
                ensureChannelExistence(interaction.channel.id).catch(err => console.log(err))
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
        resolve('yes')
    })
}

module.exports = {
    interaction_handler
}