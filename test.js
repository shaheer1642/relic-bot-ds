const {client} = require('./modules/discord_client.js');
const { WebhookClient } = require('discord.js');

client.on('ready', () => {
    console.log('client online')
    client.channels.cache.get('892006071030403072').fetchWebhooks().then((res) => console.log(res))
})