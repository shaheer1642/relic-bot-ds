const {client} = require('./modules/discord_client.js');
const {db} = require('./modules/db_connection')
const {socket} = require('./modules/socket')
const {WebhookClient} = require('discord.js')
const uuid = require('uuid')
const JSONbig = require('json-bigint');
const {inform_dc,dynamicSort,dynamicSortDesc,msToTime,msToFullTime,embedScore, convertUpper} = require('./modules/extras.js');

const channel_id = '1063435050802237540'
const message_id = '1063435290494111764'

client.on('ready', async () => {
    console.log('client is online')
    // return
    client.channels.cache.get('864199722676125757').send({
        "content": " ",
        "embeds": [
            {
                "description": "How was your experience with **softy-alt**?",
                "color": "BLUE"
            }
        ],
        "components": [
            {
                "type": 1,
                "components": [
                    {
                        "type": 2,
                        "label": "Horrible",
                        "custom_id": "as_users_rate..892087497998348349.1",
                        "style": 2,
                        "emoji": null
                    },
                    {
                        "type": 2,
                        "label": "Decent",
                        "custom_id": "as_users_rate..892087497998348349.2",
                        "style": 2,
                        "emoji": null
                    },
                    {
                        "type": 2,
                        "label": "Good",
                        "custom_id": "as_users_rate..892087497998348349.3",
                        "style": 2,
                        "emoji": null
                    },
                    {
                        "type": 2,
                        "label": "Very Good",
                        "custom_id": "as_users_rate..892087497998348349.4",
                        "style": 2,
                        "emoji": null
                    },
                    {
                        "type": 2,
                        "label": "Excellent",
                        "custom_id": "as_users_rate..892087497998348349.5",
                        "style": 2,
                        "emoji": "<:tobey:931278673154306109>"
                    }
                ]
            },
            {
                "type": 1,
                "components": {
                    "type": 2,
                    "label": "Skip",
                    "custom_id": "as_users_rate.",
                    "style": 2
                }
            }
        ],
        "ephemeral": true
    })
})

client.on('interactionCreate', interaction => {
})

function sentMsgInBotTest(payload) {
    client.channels.cache.get('864199722676125757').send(payload).catch(console.error)
}