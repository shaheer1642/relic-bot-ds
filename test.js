const {client} = require('./modules/discord_client.js');
const { WebhookClient } = require('discord.js');

client.on('ready', () => {
    console.log('client online')
})